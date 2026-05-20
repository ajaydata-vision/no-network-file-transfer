import { gzip } from "pako";
import { v4 as uuidv4 } from "uuid";
import { CHUNK_SIZE_BYTES, SESSION_DURATION_MS } from "./constants";
import { hashArrayBuffer, hashBytes } from "./hashing";
import { uint8ArrayToBase64 } from "./base64";
import type { PreparedTransfer, TransferPayload } from "../types/transfer";

export function splitIntoChunks(bytes: Uint8Array, chunkSize = CHUNK_SIZE_BYTES): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(bytes.slice(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks : [new Uint8Array()];
}

export function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export async function prepareFileTransfer(file: File): Promise<PreparedTransfer> {
  const buffer = await file.arrayBuffer();
  const sourceBytes = new Uint8Array(buffer);
  const fileHash = await hashArrayBuffer(buffer);
  const compressedBytes = gzip(sourceBytes);
  const chunks = splitIntoChunks(compressedBytes);
  const createdAt = Date.now();

  return {
    fileName: file.name || "download",
    fileSize: file.size,
    compressedSize: compressedBytes.length,
    fileHash,
    sessionId: uuidv4(),
    createdAt,
    expiresAt: createdAt + SESSION_DURATION_MS,
    chunks,
  };
}

export async function createPayloadForChunk(
  transfer: PreparedTransfer,
  chunkIndex: number,
): Promise<TransferPayload> {
  const chunk = transfer.chunks[chunkIndex];
  return {
    v: 1,
    sessionId: transfer.sessionId,
    chunkIndex,
    totalChunks: transfer.chunks.length,
    fileName: transfer.fileName,
    fileSize: transfer.fileSize,
    compressedSize: transfer.compressedSize,
    fileHash: transfer.fileHash,
    chunkHash: await hashBytes(chunk),
    data: uint8ArrayToBase64(chunk),
    createdAt: transfer.createdAt,
    expiresAt: transfer.expiresAt,
  };
}

export async function createPayloadString(
  transfer: PreparedTransfer,
  chunkIndex: number,
): Promise<string> {
  return JSON.stringify(await createPayloadForChunk(transfer, chunkIndex));
}
