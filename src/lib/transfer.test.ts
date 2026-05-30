import { describe, expect, it } from "vitest";
import { gzip } from "pako";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./base64";
import {
  concatChunks,
  createPayloadForChunk,
  estimateSessionDurationMs,
  splitIntoChunks,
} from "./fileEncoding";
import { DEFAULT_INTERVAL_MS, MIN_SESSION_DURATION_MS, SESSION_CYCLE_COUNT } from "./constants";
import { reconstructFile } from "./fileDecoding";
import { hashBytes } from "./hashing";
import { validatePayloadForSession } from "./validation";
import type { PreparedTransfer } from "../types/transfer";

describe("transfer utilities", () => {
  it("round trips bytes through base64", () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 255]);
    expect(Array.from(base64ToUint8Array(uint8ArrayToBase64(bytes)))).toEqual(
      Array.from(bytes),
    );
  });

  it("splits and concatenates chunks", () => {
    const bytes = new Uint8Array(5200).map((_, index) => index % 251);
    const chunks = splitIntoChunks(bytes, 1000);
    expect(chunks).toHaveLength(6);
    expect(Array.from(concatChunks(chunks))).toEqual(Array.from(bytes));
  });

  it("sizes session expiry to the transfer chunk count", () => {
    expect(estimateSessionDurationMs(1)).toBe(MIN_SESSION_DURATION_MS);
    expect(estimateSessionDurationMs(10_000)).toBe(
      10_000 * DEFAULT_INTERVAL_MS * SESSION_CYCLE_COUNT,
    );
  });

  it("validates payloads and reconstructs out-of-order chunks", async () => {
    const source = new TextEncoder().encode("local optical transfer test".repeat(200));
    const compressed = gzip(source);
    const chunks = splitIntoChunks(compressed, 700);
    const fileHash = await hashBytes(source);
    const transfer: PreparedTransfer = {
      fileName: "sample.txt",
      fileSize: source.length,
      compressedSize: compressed.length,
      fileHash,
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      chunks,
    };

    const received = new Map<number, Uint8Array>();
    let metadata;
    for (const index of [...chunks.keys()].reverse()) {
      const payload = await createPayloadForChunk(transfer, index);
      const result = await validatePayloadForSession(
        payload,
        transfer.sessionId,
        metadata,
      );
      metadata = result.metadata;
      received.set(payload.chunkIndex, result.chunk);
    }

    expect(metadata).toBeDefined();
    const blob = await reconstructFile(metadata!, received);
    const reconstructed = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(reconstructed)).toEqual(Array.from(source));
  });
});
