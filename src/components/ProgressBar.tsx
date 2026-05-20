type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{label}</span>
          <span>{Math.round(safeValue)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-cyan-600 transition-all"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
