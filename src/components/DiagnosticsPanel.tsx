import { Activity, Gauge } from "lucide-react";
import type { ScannerDiagnostics } from "../types/transfer";

type DiagnosticsPanelProps = {
  diagnostics: ScannerDiagnostics;
};

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-3">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
        <Activity className="h-4 w-4" aria-hidden="true" />
        Diagnostics
      </summary>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Metric label="FPS" value={diagnostics.fps.toFixed(1)} />
        <Metric label="Brightness" value={diagnostics.brightness.toFixed(0)} />
        <Metric label="Contrast" value={diagnostics.contrast.toFixed(0)} />
        <Metric label="Confidence" value={`${diagnostics.confidence.toFixed(0)}%`} />
        <Metric label="Decoded frames" value={diagnostics.decodedFrames.toString()} />
        <Metric label="Missed frames" value={diagnostics.failedFrames.toString()} />
      </dl>
      <div className="mt-3 flex items-start gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-600">
        <Gauge className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
        <span>{diagnostics.hint}</span>
      </div>
    </details>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-100 p-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-950">{value}</dd>
    </div>
  );
}
