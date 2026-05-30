import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CountdownTimer } from "./CountdownTimer";
import { ModeToggle } from "./ModeToggle";
import { SessionBadge } from "./SessionBadge";
import { useTransferStore } from "../store/transferStore";

export function Header() {
  const location = useLocation();
  const setMode = useTransferStore((state) => state.setMode);
  const transfer = useTransferStore((state) => state.display.preparedTransfer);

  useEffect(() => {
    setMode(location.pathname.startsWith("/camera") ? "camera" : "display");
  }, [location.pathname, setMode]);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-normal text-slate-950">
            Optical File Transfer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate QR frames on one screen, then scan them from the camera URL.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ModeToggle />
          <SessionBadge sessionId={transfer?.sessionId} />
          <CountdownTimer expiresAt={transfer?.expiresAt} />
        </div>
      </div>
    </header>
  );
}
