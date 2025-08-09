import { CustomerLifecycleChart } from "@/components/dashboard/CustomerLifecycleChart";
import { useDashboard } from "@/contexts/DashboardContext";

export function CustomersView() {
  const { filters } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Monthly lifecycle composition and customer health</p>
      </div>

      {/* Filters are available globally in the header; no local banner here */}

      {/* Main content: chart spans right, left stacks cards to avoid gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-6">
        {/* Left column: spans two rows */}
        <div className="lg:col-span-5 lg:row-span-2 flex flex-col gap-6">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">% At-Risk Rate</div>
              <div className="text-xs text-muted-foreground"># at-risk customers / total customers</div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">% Customers with DM</div>
              <div className="text-xs text-muted-foreground">Customers with at least 1 decision-maker</div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">Health / Engagement</div>
              <div className="text-xs text-muted-foreground">Weighted avg of contact score</div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm font-medium">% Repeat Revenue</div>
              <div className="text-xs text-muted-foreground">Repeat $ / total $</div>
            </div>
          </div>
          {/* Top Customers */}
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm font-semibold mb-3">Top Customers</div>
            <div className="text-sm text-muted-foreground">Table coming next.</div>
          </div>
          {/* Top Issues */}
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm font-semibold mb-3">Top Issues</div>
            <div className="text-sm text-muted-foreground">Insights coming next.</div>
          </div>
        </div>

        {/* Chart (right) spans two rows */}
        <div className="lg:col-span-7 lg:row-span-2">
          <CustomerLifecycleChart filters={filters} />
        </div>
      </div>
    </div>
  );
}
