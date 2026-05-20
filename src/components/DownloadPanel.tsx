import { Download } from "lucide-react";
import { formatBytes, formatDuration } from "../lib/format";
import type { ReceiveMetadata } from "../types/transfer";

type DownloadPanelProps = {
  metadata?: ReceiveMetadata;
  downloadUrl?: string;
  startedAt?: number;
  completedAt?: number;
};

export function DownloadPanel({
  metadata,
  downloadUrl,
  startedAt,
  completedAt,
}: DownloadPanelProps) {
  if (!metadata || !downloadUrl) return null;

  const duration = startedAt && completedAt ? completedAt - startedAt : 0;
  const averageSpeed = duration > 0 ? (metadata.fileSize * 1000) / duration : 0;

  return (
    <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <h2 className="text-lg font-semibold text-emerald-950">Transfer Complete</h2>
      <p className="mt-1 text-sm text-emerald-800">
        File hash verified. The reconstructed file is ready.
      </p>
      <a
        href={downloadUrl}
        download={metadata.fileName}
        className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        Download {metadata.fileName}
      </a>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <Metric label="Size" value={formatBytes(metadata.fileSize)} />
        <Metric label="Time" value={formatDuration(duration)} />
        <Metric label="Average" value={`${formatBytes(averageSpeed)}/s`} />
      </dl>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-2">
      <dt className="text-xs text-emerald-700">{label}</dt>
      <dd className="font-medium text-emerald-950">{value}</dd>
    </div>
  );
}
