import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copyText } from "../lib/clipboard";

type SessionBadgeProps = {
  sessionId?: string;
};

export function SessionBadge({ sessionId }: SessionBadgeProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (copyStatus === "manual") {
      manualInputRef.current?.focus();
      manualInputRef.current?.select();
    }
  }, [copyStatus]);

  if (!sessionId) return null;

  async function copy() {
    const result = await copyText(sessionId ?? "");
    setCopyStatus(result);
    if (result === "copied") {
      window.setTimeout(() => setCopyStatus("idle"), 1400);
    }
  }

  return (
    <div className="max-w-full space-y-1">
      <button
        type="button"
        className="focus-ring inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
        onClick={copy}
        title="Copy session ID"
      >
        {copyStatus === "copied" ? (
          <Check className="h-4 w-4 flex-none text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4 flex-none" aria-hidden="true" />
        )}
        <span className="truncate font-mono">
          {copyStatus === "manual" ? "Press Ctrl+C" : sessionId}
        </span>
      </button>
      {copyStatus === "manual" ? (
        <input
          ref={manualInputRef}
          readOnly
          value={sessionId}
          className="focus-ring w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-xs text-amber-950"
          onFocus={(event) => event.currentTarget.select()}
        />
      ) : null}
    </div>
  );
}
