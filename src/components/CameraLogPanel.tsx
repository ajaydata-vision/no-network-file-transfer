import { ListRestart, Trash2 } from "lucide-react";
import type { CameraLogEntry } from "../types/transfer";

type CameraLogPanelProps = {
  logs: CameraLogEntry[];
  onClear: () => void;
};

export function CameraLogPanel({ logs, onClear }: CameraLogPanelProps) {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-3" open>
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
        <ListRestart className="h-4 w-4" aria-hidden="true" />
        Camera Log
      </summary>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Newest entries first.</p>
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onClick={onClear}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>
      <ol className="mt-3 max-h-56 space-y-2 overflow-auto text-xs">
        {logs.length > 0 ? (
          logs.map((entry) => (
            <li key={entry.id} className="rounded-md bg-slate-100 p-2">
              <time className="font-mono text-slate-500">
                {new Date(entry.time).toLocaleTimeString()}
              </time>
              <p className="mt-1 text-slate-700">{entry.message}</p>
            </li>
          ))
        ) : (
          <li className="rounded-md bg-slate-100 p-2 text-slate-500">
            No camera events yet.
          </li>
        )}
      </ol>
    </details>
  );
}
