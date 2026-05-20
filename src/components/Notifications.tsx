import { CheckCircle, Info, TriangleAlert, X } from "lucide-react";
import { useTransferStore } from "../store/transferStore";

const iconByType = {
  info: Info,
  success: CheckCircle,
  warning: TriangleAlert,
  error: TriangleAlert,
};

export function Notifications() {
  const notifications = useTransferStore((state) => state.notifications);
  const clearNotification = useTransferStore((state) => state.clearNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {notifications.map((item) => {
        const Icon = iconByType[item.type];
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-panel"
          >
            <Icon className="h-4 w-4 flex-none text-cyan-700" aria-hidden="true" />
            <span className="min-w-0 flex-1">{item.message}</span>
            <button
              type="button"
              className="focus-ring rounded p-1 text-slate-500 hover:bg-slate-100"
              onClick={() => clearNotification(item.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
