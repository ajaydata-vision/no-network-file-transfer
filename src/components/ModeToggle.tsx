import { Camera, MonitorUp } from "lucide-react";
import { NavLink } from "react-router-dom";

const modes = [
  { to: "/display", label: "Display", icon: MonitorUp },
  { to: "/camera", label: "Camera", icon: Camera },
];

export function ModeToggle() {
  return (
    <div className="grid grid-cols-2 rounded-md border border-slate-300 bg-white p-1">
      {modes.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              "focus-ring inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
