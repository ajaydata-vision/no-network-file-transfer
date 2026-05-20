import { Check, Copy } from "lucide-react";
import { useState } from "react";

type SessionBadgeProps = {
  sessionId?: string;
};

export function SessionBadge({ sessionId }: SessionBadgeProps) {
  const [copied, setCopied] = useState(false);

  if (!sessionId) return null;

  async function copy() {
    await navigator.clipboard.writeText(sessionId ?? "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      className="focus-ring inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
      onClick={copy}
      title="Copy session ID"
    >
      {copied ? (
        <Check className="h-4 w-4 flex-none text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4 flex-none" aria-hidden="true" />
      )}
      <span className="truncate font-mono">{sessionId}</span>
    </button>
  );
}
