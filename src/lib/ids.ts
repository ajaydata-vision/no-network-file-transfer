export function createUiId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `${prefix}-${randomUuid}`;

  const bytes = new Uint8Array(8);
  globalThis.crypto?.getRandomValues?.(bytes);
  const randomPart =
    bytes.some((byte) => byte !== 0)
      ? Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
      : Math.random().toString(36).slice(2);

  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}
