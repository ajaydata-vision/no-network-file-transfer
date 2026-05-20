import CryptoJS from "crypto-js";

export function uint8ArrayToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

export async function hashBytes(bytes: Uint8Array): Promise<string> {
  return CryptoJS.SHA256(uint8ArrayToWordArray(bytes)).toString(CryptoJS.enc.Hex);
}

export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  return hashBytes(new Uint8Array(buffer));
}
