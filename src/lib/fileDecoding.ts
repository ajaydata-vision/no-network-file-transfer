import { ungzip } from "pako";
import { base64ToUint8Array } from "./base64";
import { concatChunks } from "./fileEncoding";
import { hashBytes } from "./hashing";
import type { ReceiveMetadata, TransferPayload } from "../types/transfer";

export function decodePayloadData(payload: TransferPayload): Uint8Array {
  return base64ToUint8Array(payload.data);
}

export async function reconstructFile(
  metadata: ReceiveMetadata,
  receivedChunks: Map<number, Uint8Array>,
): Promise<Blob> {
  const orderedChunks: Uint8Array[] = [];
  for (let index = 0; index < metadata.totalChunks; index += 1) {
    const chunk = receivedChunks.get(index);
    if (!chunk) {
      throw new Error(`Missing chunk ${index + 1}`);
    }
    orderedChunks.push(chunk);
  }

  const compressed = concatChunks(orderedChunks);
  const decompressed = ungzip(compressed);
  const reconstructedHash = await hashBytes(decompressed);
  if (reconstructedHash !== metadata.fileHash) {
    throw new Error("Reconstructed file hash does not match original hash.");
  }

  return new Blob([decompressed]);
}
