import { NavLink } from "react-router-dom";
import { Users, LayoutDashboard, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Sidebar() {
  return (
    <aside className="h-full w-56 bg-sidebar border-r flex flex-col py-6 px-4 gap-4">
      <div className="text-2xl font-bold mb-8 tracking-tight text-sidebar-primary">Sales RCA</div>
      <nav className="flex flex-col gap-2">
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="py-2 px-3 hover:bg-sidebar-accent rounded-md text-sidebar-foreground">
              <div className="flex items-center gap-2 font-medium">
                <LayoutDashboard className="w-5 h-5" /> Dashboards
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pl-6">
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/overview"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-sidebar-accent"
                    }`
                  }
                >
                  Overview
                </NavLink>
                <NavLink
                  to="/team"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-sidebar-accent"
                    }`
                  }
                >
                  Team Performance
                </NavLink>
                <NavLink
                  to="/leaderboard"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-sidebar-accent"
                    }`
                  }
                >
                  Leaderboard
                </NavLink>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>
      <div className="flex-1" />
      {/* Add logo or footer here if needed */}
    </aside>
  );
}
