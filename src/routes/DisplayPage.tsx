import { Loader2, Play } from "lucide-react";
import { useEffect } from "react";
import { ErrorNotice } from "../components/ErrorNotice";
import { FileDropzone } from "../components/FileDropzone";
import { ProgressBar } from "../components/ProgressBar";
import { QRPresenter } from "../components/QRPresenter";
import { ReceiverSetupQr } from "../components/ReceiverSetupQr";
import { TransferControls } from "../components/TransferControls";
import { TransferStats } from "../components/TransferStats";
import { MAX_INTERVAL_MS, MIN_INTERVAL_MS } from "../lib/constants";
import { formatBytes } from "../lib/format";
import { useTransferStore } from "../store/transferStore";

export function DisplayPage() {
  const display = useTransferStore((state) => state.display);
  const selectFile = useTransferStore((state) => state.selectFile);
  const prepareTransfer = useTransferStore((state) => state.prepareTransfer);
  const pauseTransfer = useTransferStore((state) => state.pauseTransfer);
  const resumeTransfer = useTransferStore((state) => state.resumeTransfer);
  const stopDisplayTransfer = useTransferStore((state) => state.stopDisplayTransfer);
  const nextChunk = useTransferStore((state) => state.nextChunk);
  const previousChunk = useTransferStore((state) => state.previousChunk);
  const setIntervalMs = useTransferStore((state) => state.setIntervalMs);
  const clearDisplayError = useTransferStore((state) => state.clearDisplayError);

  const transfer = display.preparedTransfer;
  const totalChunks = transfer?.chunks.length ?? 0;
  const currentChunk = display.currentChunkIndex + 1;
  const progress = totalChunks ? (currentChunk / totalChunks) * 100 : 0;
  const expired = transfer ? Date.now() > transfer.expiresAt : false;

  useEffect(() => {
    if (!display.isTransferring || display.isPaused || !transfer || expired) return;
    const timer = window.setInterval(nextChunk, display.intervalMs);
    return () => window.clearInterval(timer);
  }, [
    display.intervalMs,
    display.isPaused,
    display.isTransferring,
    expired,
    nextChunk,
    transfer,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[390px_minmax(0,1fr)]">
      <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-panel">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Generate QR</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a file and show the generated QR sequence on this screen.
          </p>
        </div>

        <ErrorNotice message={display.error} onDismiss={clearDisplayError} />

        <FileDropzone file={display.selectedFile} onSelect={selectFile} />

        {display.selectedFile && !transfer ? (
          <div className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">
            <span className="font-medium text-slate-950">{display.selectedFile.name}</span>
            <span className="ml-2">{formatBytes(display.selectedFile.size)}</span>
          </div>
        ) : null}

        <button
          type="button"
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-3 text-base font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!display.selectedFile || display.isPreparing}
          onClick={prepareTransfer}
        >
          {display.isPreparing ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5" aria-hidden="true" />
          )}
          {display.isPreparing ? "Preparing" : transfer ? "Restart Transfer" : "Start Transfer"}
        </button>

        <div className="space-y-2">
          <label htmlFor="interval" className="text-sm font-medium text-slate-700">
            QR interval: {display.intervalMs} ms
          </label>
          <input
            id="interval"
            type="range"
            min={MIN_INTERVAL_MS}
            max={MAX_INTERVAL_MS}
            step={50}
            value={display.intervalMs}
            onChange={(event) => setIntervalMs(Number(event.target.value))}
            className="w-full accent-cyan-700"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{MIN_INTERVAL_MS} ms</span>
            <span>{MAX_INTERVAL_MS} ms</span>
          </div>
        </div>

        <TransferStats
          transfer={transfer}
          intervalMs={display.intervalMs}
          cycleCount={display.cycleCount}
        />

        {transfer ? <ReceiverSetupQr sessionId={transfer.sessionId} /> : null}
      </section>

      <section className="flex min-h-[560px] flex-col items-center justify-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 shadow-panel">
        {transfer ? (
          <>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">
                Chunk {currentChunk} of {totalChunks}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {expired ? "Session expired" : display.isPaused ? "Paused" : "Showing QR"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {expired
                  ? "Create a new session to continue."
                  : display.isPaused
                    ? "Manual navigation remains available."
                    : `Next QR in ${display.intervalMs} ms`}
              </p>
            </div>

            <QRPresenter transfer={transfer} chunkIndex={display.currentChunkIndex} />

            <div className="w-full max-w-xl space-y-3">
              <ProgressBar value={progress} label="Cycle progress" />
              <TransferControls
                isPaused={display.isPaused}
                onPrevious={previousChunk}
                onNext={nextChunk}
                onPause={pauseTransfer}
                onResume={resumeTransfer}
                onStop={stopDisplayTransfer}
              />
            </div>
          </>
        ) : (
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-semibold text-slate-950">Ready to display</h2>
            <p className="mt-2 text-sm text-slate-500">
              Select a file, start a session, then share the session ID with the receiver.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
