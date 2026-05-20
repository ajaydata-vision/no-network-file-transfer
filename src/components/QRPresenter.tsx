import QRCode from "qrcode";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPayloadString } from "../lib/fileEncoding";
import type { PreparedTransfer } from "../types/transfer";

type QRPresenterProps = {
  transfer: PreparedTransfer;
  chunkIndex: number;
};

export function QRPresenter({ transfer, chunkIndex }: QRPresenterProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderQr() {
      setError("");
      setDataUrl("");
      try {
        const payload = await createPayloadString(transfer, chunkIndex);
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: "M",
          margin: 3,
          width: 560,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        if (!cancelled) setDataUrl(url);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not render QR code.");
        }
      }
    }

    renderQr();
    return () => {
      cancelled = true;
    };
  }, [chunkIndex, transfer]);

  return (
    <div className="flex aspect-square w-full max-w-[min(78vw,560px)] items-center justify-center rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR chunk ${chunkIndex + 1}`}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
          <span>{error || "Rendering QR"}</span>
        </div>
      )}
    </div>
  );
}
