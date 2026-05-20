import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatDuration } from "../lib/format";

type CountdownTimerProps = {
  expiresAt?: number;
};

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!expiresAt) return null;

  const remaining = expiresAt - now;
  const expired = remaining <= 0;

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        expired
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-700",
      ].join(" ")}
    >
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span>{expired ? "Expired" : formatDuration(remaining)}</span>
    </div>
  );
}
