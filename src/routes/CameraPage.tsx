import { Camera, Play } from "lucide-react";
import { useEffect } from "react";
import { CameraLogPanel } from "../components/CameraLogPanel";
import { CameraScanner } from "../components/CameraScanner";
import { DiagnosticsPanel } from "../components/DiagnosticsPanel";
import { DownloadPanel } from "../components/DownloadPanel";
import { ErrorNotice } from "../components/ErrorNotice";
import { ProgressBar } from "../components/ProgressBar";
import { ReceiverHelp } from "../components/ReceiverHelp";
import { createPayloadString } from "../lib/fileEncoding";
import { useTransferStore } from "../store/transferStore";

export function CameraPage() {
  const camera = useTransferStore((state) => state.camera);
  const displayTransfer = useTransferStore((state) => state.display.preparedTransfer);
  const setCameraSessionInput = useTransferStore((state) => state.setCameraSessionInput);
  const startCameraSession = useTransferStore((state) => state.startCameraSession);
  const startLoopbackSession = useTransferStore((state) => state.startLoopbackSession);
  const recordScannedPayload = useTransferStore((state) => state.recordScannedPayload);
  const addCameraLog = useTransferStore((state) => state.addCameraLog);
  const clearCameraLogs = useTransferStore((state) => state.clearCameraLogs);
  const clearCameraError = useTransferStore((state) => state.clearCameraError);

  const received = camera.receivedChunks.size;
  const total = camera.metadata?.totalChunks ?? 0;
  const progress = total ? (received / total) * 100 : 0;

  useEffect(() => {
    if (displayTransfer && !camera.enteredSessionId) {
      setCameraSessionInput(displayTransfer.sessionId);
    }
  }, [camera.enteredSessionId, displayTransfer, setCameraSessionInput]);

  async function runLocalLoopback() {
    if (!displayTransfer) return;
    startLoopbackSession(displayTransfer.sessionId);
    addCameraLog(`Same-browser test has ${displayTransfer.chunks.length} chunk(s).`);
    for (let index = 0; index < displayTransfer.chunks.length; index += 1) {
      const payload = await createPayloadString(displayTransfer, index);
      await recordScannedPayload(payload);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[390px_minmax(0,1fr)]">
      <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-panel">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Camera Mode</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the sender session ID, open the camera, and scan the QR sequence.
          </p>
        </div>

        <ReceiverHelp compact />

        <ErrorNotice message={camera.error} onDismiss={clearCameraError} />

        <div className="space-y-2">
          <label htmlFor="sessionId" className="text-sm font-medium text-slate-700">
            Session ID
          </label>
          <input
            id="sessionId"
            value={camera.enteredSessionId}
            onChange={(event) => setCameraSessionInput(event.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="focus-ring w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-950"
          />
        </div>

        <button
          type="button"
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-3 text-base font-semibold text-white hover:bg-cyan-800"
          onClick={startCameraSession}
        >
          {camera.isCameraActive ? (
            <Camera className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5" aria-hidden="true" />
          )}
          {camera.isCameraActive ? "Camera Active" : "Start Camera"}
        </button>

        {displayTransfer ? (
          <button
            type="button"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-950 hover:bg-cyan-100"
            onClick={runLocalLoopback}
          >
            Run Same-Browser Test
          </button>
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Same-browser test appears after you create a Display Mode session in this
            tab.
          </div>
        )}

        <div className="rounded-md bg-slate-100 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-950">Chunks</span>
            <span className="text-slate-600">
              {total ? `${received} of ${total}` : `${received} received`}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={progress} label="Receive progress" />
          </div>
        </div>

        <DiagnosticsPanel diagnostics={camera.diagnostics} />
        <CameraLogPanel logs={camera.logs} onClear={clearCameraLogs} />
      </section>

      <section className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4 shadow-panel">
        {camera.status === "complete" ? (
          <DownloadPanel
            metadata={camera.metadata}
            downloadUrl={camera.downloadUrl}
            startedAt={camera.startedAt}
            completedAt={camera.completedAt}
          />
        ) : null}

        {camera.isCameraActive ? (
          <CameraScanner />
        ) : camera.status !== "complete" ? (
          <div className="flex min-h-[480px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold text-slate-950">Ready to scan</h2>
              <p className="mt-2 text-sm text-slate-500">
                Start the camera after entering a UUID session ID. The receiver validates
                the transfer when matching QR payloads are scanned.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
