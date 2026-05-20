import { Camera, Copy, Download, MonitorUp } from "lucide-react";

type ReceiverHelpProps = {
  compact?: boolean;
};

export function ReceiverHelp({ compact = false }: ReceiverHelpProps) {
  const steps = [
    {
      icon: Camera,
      title: "Open Camera Mode",
      text: "Use another phone, laptop, or browser tab and switch to Camera.",
    },
    {
      icon: Copy,
      title: "Enter Session ID",
      text: "Copy the session ID from Display Mode and paste it into Camera Mode.",
    },
    {
      icon: MonitorUp,
      title: "Point at QR",
      text: "Start the camera and keep the QR code centered until all chunks arrive.",
    },
    {
      icon: Download,
      title: "Download",
      text: "When the hash check passes, click Download File on the receiver.",
    },
  ];

  return (
    <section className="rounded-md border border-cyan-200 bg-cyan-50 p-4">
      <h2 className="text-sm font-semibold text-cyan-950">How to receive this file</h2>
      <p className="mt-1 text-sm text-cyan-800">
        For real optical transfer, use a second device or a second browser window with a
        camera pointed at this screen. For local-only verification, Camera Mode can run
        a same-browser test after a Display session is created.
      </p>
      <div className={compact ? "mt-3 space-y-3" : "mt-3 grid gap-3 sm:grid-cols-2"}>
        {steps.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-md bg-white text-cyan-800">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-medium text-cyan-950">{title}</h3>
              <p className="mt-0.5 text-sm text-cyan-800">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
