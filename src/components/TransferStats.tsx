import { formatBytes, estimateTransferDuration } from "../lib/format";
import type { PreparedTransfer } from "../types/transfer";

type TransferStatsProps = {
  transfer?: PreparedTransfer;
  intervalMs: number;
  cycleCount: number;
};

export function TransferStats({ transfer, intervalMs, cycleCount }: TransferStatsProps) {
  if (!transfer) return null;

  const speed = (1800 * 1000) / intervalMs;

  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-md bg-slate-100 p-3">
        <dt className="text-slate-500">File</dt>
        <dd className="mt-1 truncate font-medium text-slate-950">{transfer.fileName}</dd>
      </div>
      <div className="rounded-md bg-slate-100 p-3">
        <dt className="text-slate-500">Original size</dt>
        <dd className="mt-1 font-medium text-slate-950">{formatBytes(transfer.fileSize)}</dd>
      </div>
      <div className="rounded-md bg-slate-100 p-3">
        <dt className="text-slate-500">Compressed size</dt>
        <dd className="mt-1 font-medium text-slate-950">
          {formatBytes(transfer.compressedSize)}
        </dd>
      </div>
      <div className="rounded-md bg-slate-100 p-3">
        <dt className="text-slate-500">Estimated cycle</dt>
        <dd className="mt-1 font-medium text-slate-950">
          {estimateTransferDuration(transfer.chunks.length, intervalMs)}
        </dd>
      </div>
      <div className="rounded-md bg-slate-100 p-3">
        <dt className="text-slate-500">Display rate</dt>
        <dd className="mt-1 font-medium text-slate-950">{formatBytes(speed)}/s</dd>
      </div>
      <div className="rounded-md bg-slate-100 p-3">
        <dt className="text-slate-500">Cycles shown</dt>
        <dd className="mt-1 font-medium text-slate-950">{cycleCount}</dd>
      </div>
      <div className="rounded-md bg-slate-100 p-3 sm:col-span-2">
        <dt className="text-slate-500">SHA-256</dt>
        <dd className="mt-1 font-mono text-sm font-medium text-slate-950">
          {transfer.fileHash.slice(0, 16)}
        </dd>
      </div>
    </dl>
  );
}
