import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import OverviewView from "./pages/OverviewView";
import TeamView from "./pages/TeamView";
import { LeaderboardView } from "./pages/LeaderboardView";
import { NewDealsView } from "./pages/NewDealsView";
import { CustomersView } from "./pages/CustomersView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewView />} />
            <Route path="team" element={<TeamView />} />
            <Route path="leaderboard" element={<LeaderboardView />} />
            <Route path="new-deals" element={<NewDealsView />} />
            <Route path="customers" element={<CustomersView />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
