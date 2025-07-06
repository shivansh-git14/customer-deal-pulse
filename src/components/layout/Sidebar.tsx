import { NavLink } from "react-router-dom";
import { Users, LayoutDashboard } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="h-full w-56 bg-background border-r flex flex-col py-6 px-4 gap-4">
      <div className="text-2xl font-bold mb-8 tracking-tight">Sales RCA</div>
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/overview"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" /> Overview
        </NavLink>
        <NavLink
          to="/team"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
            }`
          }
        >
          <Users className="w-5 h-5" /> Team Performance
        </NavLink>
      </nav>
      <div className="flex-1" />
      {/* Add logo or footer here if needed */}
    </aside>
  );
}
