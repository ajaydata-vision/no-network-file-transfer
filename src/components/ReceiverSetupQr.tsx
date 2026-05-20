import QRCode from "qrcode";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReceiverSetupQrProps = {
  sessionId: string;
};

export function ReceiverSetupQr({ sessionId }: ReceiverSetupQrProps) {
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin);
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

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

  async function copyUrl() {
    await navigator.clipboard.writeText(receiverUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-cyan-700" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-950">Receiver Setup QR</h2>
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
            <span className="font-medium text-slate-700">Receiver app base URL</span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
              placeholder="http://192.168.1.10:15173"
            />
          </label>
          <div className="rounded-md bg-slate-100 p-2 font-mono text-xs text-slate-700">
            <span className="break-all">{receiverUrl}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={copyUrl}
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              Copy
            </button>
            <a
              href={receiverUrl}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
