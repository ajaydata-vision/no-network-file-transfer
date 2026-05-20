export type AppMode = "display" | "camera";

export type TransferPayload = {
  v: 1;
  sessionId: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileSize: number;
  compressedSize: number;
  fileHash: string;
  chunkHash: string;
  data: string;
  createdAt: number;
  expiresAt: number;
};

export type PreparedTransfer = {
  fileName: string;
  fileSize: number;
  compressedSize: number;
  fileHash: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  chunks: Uint8Array[];
};

export type ReceiveMetadata = {
  sessionId: string;
  totalChunks: number;
  fileName: string;
  fileSize: number;
  compressedSize: number;
  fileHash: string;
  expiresAt: number;
};

export type ScannerDiagnostics = {
  fps: number;
  brightness: number;
  contrast: number;
  confidence: number;
  failedFrames: number;
  decodedFrames: number;
  hint: string;
};

export type ScanStatus =
  | "idle"
  | "waiting"
  | "detected"
  | "scanned"
  | "complete"
  | "error";

export type Notification = {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
};
