import jsQR from "jsqr";
import { Camera, Crosshair, SlidersHorizontal, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { applyBrightness, hintForFrame, measureFrame } from "../lib/diagnostics";
import { SCAN_INTERVAL_MS } from "../lib/constants";
import { useTransferStore } from "../store/transferStore";
import { ErrorNotice } from "./ErrorNotice";

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const framesRef = useRef({ frames: 0, since: performance.now(), fps: 0 });
  const missedFramesRef = useRef(0);
  const [runtimeError, setRuntimeError] = useState("");
  const [focusMessage, setFocusMessage] = useState("");

  const isActive = useTransferStore((state) => state.camera.isCameraActive);
  const status = useTransferStore((state) => state.camera.status);
  const brightnessBoost = useTransferStore((state) => state.camera.brightnessBoost);
  const stopCameraSession = useTransferStore((state) => state.stopCameraSession);
  const recordScannedPayload = useTransferStore((state) => state.recordScannedPayload);
  const updateDiagnostics = useTransferStore((state) => state.updateDiagnostics);
  const setBrightnessBoost = useTransferStore((state) => state.setBrightnessBoost);

  useEffect(() => {
    if (!isActive) {
      stopStream();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setRuntimeError("");
      setFocusMessage("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        scheduleScan();
      } catch (error) {
        setRuntimeError(
          error instanceof Error
            ? error.message
            : "Camera permission was denied or unavailable.",
        );
        stopCameraSession();
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [isActive, stopCameraSession]);

  function stopStream() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function scheduleScan() {
    timerRef.current = window.setTimeout(scanFrame, SCAN_INTERVAL_MS);
  }

  async function scanFrame() {
    if (!isActive || busyRef.current) {
      scheduleScan();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleScan();
      return;
    }

    busyRef.current = true;
    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        scheduleScan();
        return;
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(video, 0, 0, width, height);
      const image = context.getImageData(0, 0, width, height);
      applyBrightness(image.data, brightnessBoost);
      const metrics = measureFrame(image.data);
      const code = jsQR(image.data, image.width, image.height, {
        inversionAttempts: "attemptBoth",
      });

      const frameStats = framesRef.current;
      frameStats.frames += 1;
      const elapsed = performance.now() - frameStats.since;
      if (elapsed >= 1000) {
        frameStats.fps = (frameStats.frames * 1000) / elapsed;
        frameStats.frames = 0;
        frameStats.since = performance.now();
      }

      if (code?.data) {
        await recordScannedPayload(code.data);
        updateDiagnostics({
          fps: frameStats.fps,
          brightness: metrics.brightness,
          contrast: metrics.contrast,
          confidence: 85,
          hint: "QR detected.",
        });
      } else {
        missedFramesRef.current += 1;
        updateDiagnostics({
          fps: frameStats.fps,
          brightness: metrics.brightness,
          contrast: metrics.contrast,
          failedFrames: missedFramesRef.current,
          confidence: Math.max(0, 60 - missedFramesRef.current),
          hint: hintForFrame(
            metrics.brightness,
            metrics.contrast,
            missedFramesRef.current,
          ),
        });
      }
    } finally {
      busyRef.current = false;
      if (useTransferStore.getState().camera.isCameraActive) {
        scheduleScan();
      }
    }
  }

  async function focusCamera() {
    setFocusMessage("");
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
      focusMode?: string[];
    };

    try {
      if (capabilities?.focusMode?.includes("continuous")) {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
        });
        setFocusMessage("Continuous focus requested.");
      } else {
        setFocusMessage("Manual focus is not supported on this camera.");
      }
    } catch {
      setFocusMessage("Focus request was not accepted by this browser.");
    }
  }

  const statusLabel =
    status === "scanned"
      ? "Scanned"
      : status === "detected"
        ? "Detected"
        : status === "complete"
          ? "Complete"
          : "Waiting for QR";

  return (
    <section className="space-y-3">
      <ErrorNotice message={runtimeError} onDismiss={() => setRuntimeError("")} />

      <div className="relative overflow-hidden rounded-md bg-slate-950">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-video w-full object-cover"
          style={{ filter: `brightness(${brightnessBoost}%)` }}
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex aspect-square w-[min(72vw,360px)] items-center justify-center border-2 border-cyan-300/90 bg-cyan-300/5">
            <Crosshair className="h-8 w-8 text-cyan-200" aria-hidden="true" />
          </div>
        </div>
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-md bg-slate-950/80 px-3 py-2 text-sm font-medium text-white">
          <Camera className="h-4 w-4" aria-hidden="true" />
          {statusLabel}
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <SlidersHorizontal className="h-4 w-4 flex-none" aria-hidden="true" />
          <span className="w-24">Brightness</span>
          <input
            type="range"
            min={50}
            max={180}
            step={5}
            value={brightnessBoost}
            onChange={(event) => setBrightnessBoost(Number(event.target.value))}
            className="min-w-0 flex-1 accent-cyan-700"
          />
          <span className="w-12 text-right">{brightnessBoost}%</span>
        </label>
        <button
          type="button"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={focusCamera}
        >
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          Focus
        </button>
        <button
          type="button"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          onClick={stopCameraSession}
        >
          <Square className="h-4 w-4" aria-hidden="true" />
          Cancel
        </button>
      </div>

      {focusMessage ? <p className="text-sm text-slate-500">{focusMessage}</p> : null}
    </section>
  );
}
