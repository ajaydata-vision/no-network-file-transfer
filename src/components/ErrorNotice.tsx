import { AlertTriangle, X } from "lucide-react";

type ErrorNoticeProps = {
  message?: string;
  onDismiss?: () => void;
};

export function ErrorNotice({ message, onDismiss }: ErrorNoticeProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className="focus-ring rounded p-1 text-red-700 hover:bg-red-100"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
