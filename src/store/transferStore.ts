import { create } from "zustand";
import {
  DEFAULT_INTERVAL_MS,
  MAX_FILE_SIZE_BYTES,
  MAX_INTERVAL_MS,
  MIN_INTERVAL_MS,
} from "../lib/constants";
import { createDownloadUrl, revokeDownloadUrl } from "../lib/download";
import { prepareFileTransfer } from "../lib/fileEncoding";
import { reconstructFile } from "../lib/fileDecoding";
import { clamp } from "../lib/format";
import { emptyDiagnostics } from "../lib/diagnostics";
import {
  isValidUuid,
  parseTransferPayload,
  validatePayloadForSession,
} from "../lib/validation";
import type {
  AppMode,
  Notification,
  PreparedTransfer,
  ReceiveMetadata,
  ScannerDiagnostics,
  ScanStatus,
} from "../types/transfer";

type DisplayState = {
  selectedFile?: File;
  preparedTransfer?: PreparedTransfer;
  currentChunkIndex: number;
  isPreparing: boolean;
  isTransferring: boolean;
  isPaused: boolean;
  intervalMs: number;
  cycleCount: number;
  error?: string;
};

type CameraState = {
  enteredSessionId: string;
  activeSessionId?: string;
  isCameraActive: boolean;
  status: ScanStatus;
  receivedChunks: Map<number, Uint8Array>;
  metadata?: ReceiveMetadata;
  startedAt?: number;
  completedAt?: number;
  diagnostics: ScannerDiagnostics;
  brightnessBoost: number;
  downloadUrl?: string;
  error?: string;
};

type TransferStore = {
  appMode: AppMode;
  display: DisplayState;
  camera: CameraState;
  notifications: Notification[];
  setMode: (mode: AppMode) => void;
  selectFile: (file?: File) => void;
  prepareTransfer: () => Promise<void>;
  startTransfer: () => void;
  pauseTransfer: () => void;
  resumeTransfer: () => void;
  stopDisplayTransfer: () => void;
  setCurrentChunk: (index: number) => void;
  nextChunk: () => void;
  previousChunk: () => void;
  setIntervalMs: (intervalMs: number) => void;
  setCameraSessionInput: (sessionId: string) => void;
  startCameraSession: () => void;
  stopCameraSession: () => void;
  recordScannedPayload: (raw: string) => Promise<boolean>;
  updateDiagnostics: (diagnostics: Partial<ScannerDiagnostics>) => void;
  setBrightnessBoost: (value: number) => void;
  clearDisplayError: () => void;
  clearCameraError: () => void;
  clearNotification: (id: string) => void;
};

const initialDisplay: DisplayState = {
  currentChunkIndex: 0,
  isPreparing: false,
  isTransferring: false,
  isPaused: false,
  intervalMs: DEFAULT_INTERVAL_MS,
  cycleCount: 0,
};

const initialCamera: CameraState = {
  enteredSessionId: "",
  isCameraActive: false,
  status: "idle",
  receivedChunks: new Map(),
  diagnostics: emptyDiagnostics,
  brightnessBoost: 100,
};

function notify(message: string, type: Notification["type"] = "info"): Notification {
  return {
    id: crypto.randomUUID(),
    message,
    type,
  };
}

function resetCameraState(camera: CameraState): CameraState {
  revokeDownloadUrl(camera.downloadUrl);
  return {
    ...initialCamera,
    enteredSessionId: camera.enteredSessionId,
    brightnessBoost: camera.brightnessBoost,
  };
}

export const useTransferStore = create<TransferStore>((set, get) => ({
  appMode: "display",
  display: initialDisplay,
  camera: initialCamera,
  notifications: [],

  setMode: (mode) => set({ appMode: mode }),

  selectFile: (file) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      set((state) => ({
        display: {
          ...state.display,
          selectedFile: undefined,
          preparedTransfer: undefined,
          isTransferring: false,
          error: "File is larger than the 100 MB limit.",
        },
      }));
      return;
    }

    set((state) => ({
      display: {
        ...state.display,
        selectedFile: file,
        preparedTransfer: undefined,
        currentChunkIndex: 0,
        cycleCount: 0,
        isTransferring: false,
        isPaused: false,
        error: undefined,
      },
    }));
  },

  prepareTransfer: async () => {
    const file = get().display.selectedFile;
    if (!file) {
      set((state) => ({
        display: { ...state.display, error: "Choose a file before starting." },
      }));
      return;
    }

    set((state) => ({
      display: { ...state.display, isPreparing: true, error: undefined },
    }));

    try {
      const preparedTransfer = await prepareFileTransfer(file);
      set((state) => ({
        display: {
          ...state.display,
          preparedTransfer,
          currentChunkIndex: 0,
          cycleCount: 0,
          isPreparing: false,
          isTransferring: true,
          isPaused: false,
        },
        notifications: [
          notify("Transfer session created.", "success"),
          ...state.notifications.slice(0, 2),
        ],
      }));
    } catch (error) {
      set((state) => ({
        display: {
          ...state.display,
          isPreparing: false,
          error: error instanceof Error ? error.message : "Could not prepare this file.",
        },
      }));
    }
  },

  startTransfer: () => {
    const { preparedTransfer } = get().display;
    if (!preparedTransfer) return;
    set((state) => ({
      display: {
        ...state.display,
        isTransferring: true,
        isPaused: false,
        error: undefined,
      },
    }));
  },

  pauseTransfer: () =>
    set((state) => ({
      display: { ...state.display, isPaused: true },
    })),

  resumeTransfer: () =>
    set((state) => ({
      display: { ...state.display, isPaused: false },
    })),

  stopDisplayTransfer: () =>
    set((state) => ({
      display: {
        ...state.display,
        preparedTransfer: undefined,
        currentChunkIndex: 0,
        cycleCount: 0,
        isTransferring: false,
        isPaused: false,
      },
    })),

  setCurrentChunk: (index) =>
    set((state) => {
      const total = state.display.preparedTransfer?.chunks.length ?? 0;
      if (total === 0) return state;
      return {
        display: {
          ...state.display,
          currentChunkIndex: clamp(index, 0, total - 1),
        },
      };
    }),

  nextChunk: () =>
    set((state) => {
      const total = state.display.preparedTransfer?.chunks.length ?? 0;
      if (total === 0) return state;
      const nextIndex = (state.display.currentChunkIndex + 1) % total;
      return {
        display: {
          ...state.display,
          currentChunkIndex: nextIndex,
          cycleCount:
            nextIndex === 0 ? state.display.cycleCount + 1 : state.display.cycleCount,
        },
      };
    }),

  previousChunk: () =>
    set((state) => {
      const total = state.display.preparedTransfer?.chunks.length ?? 0;
      if (total === 0) return state;
      return {
        display: {
          ...state.display,
          currentChunkIndex:
            (state.display.currentChunkIndex - 1 + total) % total,
        },
      };
    }),

  setIntervalMs: (intervalMs) =>
    set((state) => ({
      display: {
        ...state.display,
        intervalMs: clamp(intervalMs, MIN_INTERVAL_MS, MAX_INTERVAL_MS),
      },
    })),

  setCameraSessionInput: (sessionId) =>
    set((state) => ({
      camera: {
        ...state.camera,
        enteredSessionId: sessionId.trim(),
        error: undefined,
      },
    })),

  startCameraSession: () => {
    const enteredSessionId = get().camera.enteredSessionId.trim();
    if (!isValidUuid(enteredSessionId)) {
      set((state) => ({
        camera: {
          ...state.camera,
          error: "Enter a valid UUID session ID.",
          status: "error",
        },
      }));
      return;
    }

    set((state) => ({
      camera: {
        ...resetCameraState(state.camera),
        enteredSessionId,
        activeSessionId: enteredSessionId,
        isCameraActive: true,
        status: "waiting",
        startedAt: Date.now(),
        error: undefined,
      },
    }));
  },

  stopCameraSession: () =>
    set((state) => ({
      camera: resetCameraState(state.camera),
    })),

  recordScannedPayload: async (raw) => {
    const state = get();
    const sessionId = state.camera.activeSessionId;
    if (!sessionId || state.camera.status === "complete") return false;

    const payload = parseTransferPayload(raw);
    if (!payload) {
      set((current) => ({
        camera: {
          ...current.camera,
          status: "waiting",
          diagnostics: {
            ...current.camera.diagnostics,
            failedFrames: current.camera.diagnostics.failedFrames + 1,
          },
        },
      }));
      return false;
    }

    set((current) => ({
      camera: { ...current.camera, status: "detected" },
    }));

    try {
      const currentCamera = get().camera;
      const { chunk, metadata } = await validatePayloadForSession(
        payload,
        sessionId,
        currentCamera.metadata,
      );

      const receivedChunks = new Map(currentCamera.receivedChunks);
      const isNewChunk = !receivedChunks.has(payload.chunkIndex);
      receivedChunks.set(payload.chunkIndex, chunk);

      const decodedFrames = currentCamera.diagnostics.decodedFrames + 1;
      const progress = Math.round((receivedChunks.size / metadata.totalChunks) * 100);
      const diagnostics = {
        ...currentCamera.diagnostics,
        decodedFrames,
        confidence: Math.max(currentCamera.diagnostics.confidence, progress),
        hint: isNewChunk ? "Chunk received." : "Duplicate chunk ignored.",
      };

      if (receivedChunks.size === metadata.totalChunks) {
        const blob = await reconstructFile(metadata, receivedChunks);
        const downloadUrl = createDownloadUrl(blob);
        set((current) => ({
          camera: {
            ...current.camera,
            isCameraActive: false,
            status: "complete",
            receivedChunks,
            metadata,
            completedAt: Date.now(),
            diagnostics: { ...diagnostics, confidence: 100, hint: "Transfer complete." },
            downloadUrl,
            error: undefined,
          },
          notifications: [
            notify("File reconstructed and verified.", "success"),
            ...current.notifications.slice(0, 2),
          ],
        }));
        return true;
      }

      set((current) => ({
        camera: {
          ...current.camera,
          status: "scanned",
          receivedChunks,
          metadata,
          diagnostics,
          error: undefined,
        },
      }));
      return isNewChunk;
    } catch (error) {
      set((current) => ({
        camera: {
          ...current.camera,
          status: "error",
          error: error instanceof Error ? error.message : "Invalid QR payload.",
        },
      }));
      return false;
    }
  },

  updateDiagnostics: (diagnostics) =>
    set((state) => ({
      camera: {
        ...state.camera,
        diagnostics: { ...state.camera.diagnostics, ...diagnostics },
      },
    })),

  setBrightnessBoost: (value) =>
    set((state) => ({
      camera: {
        ...state.camera,
        brightnessBoost: clamp(value, 50, 180),
      },
    })),

  clearDisplayError: () =>
    set((state) => ({
      display: { ...state.display, error: undefined },
    })),

  clearCameraError: () =>
    set((state) => ({
      camera: { ...state.camera, error: undefined },
    })),

  clearNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),
}));
