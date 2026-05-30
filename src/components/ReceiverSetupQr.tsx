import QRCode from "qrcode";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { copyText } from "../lib/clipboard";

type ReceiverSetupQrProps = {
  sessionId: string;
};

export function ReceiverSetupQr({ sessionId }: ReceiverSetupQrProps) {
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin);
  const [dataUrl, setDataUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");
  const manualTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const receiverUrl = useMemo(() => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    return `${cleanBase}/camera?session=${encodeURIComponent(sessionId)}`;
  }, [baseUrl, sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const url = await QRCode.toDataURL(receiverUrl, {
        errorCorrectionLevel: "M",
        margin: 3,
        width: 240,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      if (!cancelled) setDataUrl(url);
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [receiverUrl]);

  useEffect(() => {
    if (copyStatus === "manual") {
      manualTextareaRef.current?.focus();
      manualTextareaRef.current?.select();
    }
  }, [copyStatus]);

  async function copyUrl() {
    const result = await copyText(receiverUrl);
    setCopyStatus(result);
    if (result === "copied") {
      window.setTimeout(() => setCopyStatus("idle"), 1400);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-cyan-700" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-950">Camera URL QR</h2>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="flex h-32 w-32 items-center justify-center rounded-md border border-slate-200 bg-white p-2">
          {dataUrl ? (
            <img src={dataUrl} alt="Receiver setup QR" className="h-full w-full" />
          ) : (
            <QrCode className="h-8 w-8 text-slate-300" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Camera app base URL</span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
              placeholder="http://192.168.1.10:15173"
            />
          </label>
          <div className="rounded-md bg-slate-100 p-2 font-mono text-xs text-slate-700">
            <span className="mb-1 block font-sans font-medium text-slate-500">
              Camera URL
            </span>
            <span className="break-all">{receiverUrl}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={copyUrl}
            >
              {copyStatus === "copied" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copyStatus === "manual" ? "Press Ctrl+C" : "Copy"}
            </button>
            <a
              href={receiverUrl}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open
            </a>
          </div>
          {copyStatus === "manual" ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
              <p className="mb-2 font-medium">Browser blocked clipboard access.</p>
              <textarea
                ref={manualTextareaRef}
                readOnly
                value={receiverUrl}
                className="focus-ring h-16 w-full resize-none rounded border border-amber-300 bg-white p-2 font-mono text-xs text-slate-950"
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
