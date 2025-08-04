import { useDashboard } from '@/contexts/DashboardContext';
import { NewDealsMetrics } from '@/components/dashboard/NewDealsMetrics';
import { NewDealsWaterfall } from '@/components/dashboard/NewDealsWaterfall';
import { NewDealsInsights } from '@/components/dashboard/NewDealsInsights';
import { TopDealsTable } from '@/components/dashboard/TopDealsTable';
import { LostOpportunitiesTable } from '@/components/dashboard/LostOpportunitiesTable';

export function NewDealsView() {
  const { filters } = useDashboard();

  return (
    <div className="flex-1 space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Waterfall Chart + Top Deals Table */}
        <div className="lg:col-span-2 space-y-6">
          <NewDealsWaterfall filters={filters} />
          <TopDealsTable filters={filters} />
        </div>

        {/* Right Column - Hero Metrics + Insights + Lost Opportunities */}
        <div className="space-y-6">
          <NewDealsMetrics filters={filters} />
          <NewDealsInsights filters={filters} />
          <LostOpportunitiesTable filters={filters} />
        </div>
      </div>
    </div>
  );
}
