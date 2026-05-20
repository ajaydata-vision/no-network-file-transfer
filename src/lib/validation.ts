import { UUID_PATTERN } from "./constants";
import { decodePayloadData } from "./fileDecoding";
import { hashBytes } from "./hashing";
import type { ReceiveMetadata, TransferPayload } from "../types/transfer";

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function parseTransferPayload(raw: string): TransferPayload | null {
  try {
    const payload = JSON.parse(raw) as Partial<TransferPayload>;
    if (
      payload.v !== 1 ||
      typeof payload.sessionId !== "string" ||
      typeof payload.chunkIndex !== "number" ||
      typeof payload.totalChunks !== "number" ||
      typeof payload.fileName !== "string" ||
      typeof payload.fileSize !== "number" ||
      typeof payload.compressedSize !== "number" ||
      typeof payload.fileHash !== "string" ||
      typeof payload.chunkHash !== "string" ||
      typeof payload.data !== "string" ||
      typeof payload.createdAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }
    return payload as TransferPayload;
  } catch {
    return null;
  }
}

export function metadataFromPayload(payload: TransferPayload): ReceiveMetadata {
  return {
    sessionId: payload.sessionId,
    totalChunks: payload.totalChunks,
    fileName: payload.fileName,
    fileSize: payload.fileSize,
    compressedSize: payload.compressedSize,
    fileHash: payload.fileHash,
    expiresAt: payload.expiresAt,
  };
}

export function isMetadataConsistent(
  metadata: ReceiveMetadata,
  payload: TransferPayload,
): boolean {
  return (
    metadata.sessionId === payload.sessionId &&
    metadata.totalChunks === payload.totalChunks &&
    metadata.fileName === payload.fileName &&
    metadata.fileSize === payload.fileSize &&
    metadata.compressedSize === payload.compressedSize &&
    metadata.fileHash === payload.fileHash &&
    metadata.expiresAt === payload.expiresAt
  );
}

export async function validatePayloadForSession(
  payload: TransferPayload,
  expectedSessionId: string,
  existingMetadata?: ReceiveMetadata,
): Promise<{ chunk: Uint8Array; metadata: ReceiveMetadata }> {
  if (payload.sessionId !== expectedSessionId) {
    throw new Error("QR belongs to a different session.");
  }
  if (!isValidUuid(payload.sessionId)) {
    throw new Error("QR session ID is not valid.");
  }
  if (Date.now() > payload.expiresAt) {
    throw new Error("This transfer session has expired.");
  }
  if (
    payload.chunkIndex < 0 ||
    payload.chunkIndex >= payload.totalChunks ||
    !Number.isInteger(payload.chunkIndex) ||
    !Number.isInteger(payload.totalChunks)
  ) {
    throw new Error("QR chunk index is invalid.");
  }
  if (payload.totalChunks < 1) {
    throw new Error("QR total chunk count is invalid.");
  }
  if (existingMetadata && !isMetadataConsistent(existingMetadata, payload)) {
    throw new Error("QR metadata does not match the active transfer.");
  }

  const chunk = decodePayloadData(payload);
  const chunkHash = await hashBytes(chunk);
  if (chunkHash !== payload.chunkHash) {
    throw new Error("QR chunk hash mismatch.");
  }

  return {
    chunk,
    metadata: existingMetadata ?? metadataFromPayload(payload),
  };
}
