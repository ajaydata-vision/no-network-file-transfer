import { ChevronLeft, ChevronRight, Pause, Play, Square } from "lucide-react";

type TransferControlsProps = {
  isPaused: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

export function TransferControls({
  isPaused,
  onPrevious,
  onNext,
  onPause,
  onResume,
  onStop,
}: TransferControlsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={onPrevious}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Prev
      </button>
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={onNext}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        Next
      </button>
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        onClick={isPaused ? onResume : onPause}
      >
        {isPaused ? (
          <Play className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Pause className="h-4 w-4" aria-hidden="true" />
        )}
        {isPaused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        onClick={onStop}
      >
        <Square className="h-4 w-4" aria-hidden="true" />
        Stop
      </button>
    </div>
  );
}
