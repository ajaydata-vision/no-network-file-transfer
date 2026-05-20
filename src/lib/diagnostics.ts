import type { ScannerDiagnostics } from "../types/transfer";

export const emptyDiagnostics: ScannerDiagnostics = {
  fps: 0,
  brightness: 0,
  contrast: 0,
  confidence: 0,
  failedFrames: 0,
  decodedFrames: 0,
  hint: "Point the camera at the QR code.",
};

export function measureFrame(data: Uint8ClampedArray): Pick<ScannerDiagnostics, "brightness" | "contrast"> {
  let count = 0;
  let sum = 0;
  let sumSq = 0;
  const stride = 16;

  for (let i = 0; i < data.length; i += 4 * stride) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += luminance;
    sumSq += luminance * luminance;
    count += 1;
  }

  if (count === 0) {
    return { brightness: 0, contrast: 0 };
  }

  const brightness = sum / count;
  const variance = Math.max(0, sumSq / count - brightness * brightness);
  return { brightness, contrast: Math.sqrt(variance) };
}

export function applyBrightness(data: Uint8ClampedArray, brightnessPercent: number): void {
  const factor = brightnessPercent / 100;
  if (factor === 1) return;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] * factor));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor));
  }
}

export function hintForFrame(
  brightness: number,
  contrast: number,
  failedFrames: number,
): string {
  if (failedFrames < 5) return "Hold steady inside the scan box.";
  if (brightness < 70) return "Increase lighting or raise brightness.";
  if (brightness > 225) return "Reduce glare on the screen.";
  if (contrast < 25) return "Move closer and keep the QR code sharp.";
  return "Adjust angle or distance until the QR fills the scan box.";
}
