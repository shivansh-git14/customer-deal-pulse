import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardProvider } from "@/contexts/DashboardContext";

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-muted/10">
      <Sidebar />
      <DashboardProvider>
        <main className="flex-1 flex flex-col overflow-auto">
          <div className="w-full px-8 pt-8 pb-4 bg-background/80">
            <DashboardFilters />
          </div>
          <div className="flex-1 px-8 pb-8">
            <Outlet />
          </div>
        </main>
      </DashboardProvider>
    </div>
  );
}
