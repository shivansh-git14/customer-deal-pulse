import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { RevenueChartModal } from './RevenueChartModal';
import { DealSizeChartModal } from './DealSizeChartModal';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';
import { getCompletionTrend, getPerformanceTrend } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface OverviewMetricsProps {
  data: DashboardData;
  filters: DashboardFilters;
  onMetricClick?: (metric: string) => void;
}

export const OverviewMetrics = ({ data, filters, onMetricClick }: OverviewMetricsProps) => {
  const { overallRevenue, bestPerformer, avgDealSize, avgActivitiesPerRep } = data;
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showDealSizeChart, setShowDealSizeChart] = useState(false);

  if (!data) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="space-y-6">
      <RevenueChartModal
        isOpen={showRevenueChart}
        onClose={() => setShowRevenueChart(false)}
        filters={filters}
      />
      <DealSizeChartModal
        isOpen={showDealSizeChart}
        onClose={() => setShowDealSizeChart(false)}
        filters={filters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(overallRevenue.total)}
          subtitle={`${formatPercentage(overallRevenue.completionPercentage)} of target`}
          trend={getCompletionTrend(overallRevenue.completionPercentage)}
          onClick={() => setShowRevenueChart(true)}
          isClickable={true}
        />

        <MetricCard
          title="Average Deal Size"
          value={formatCurrency(avgDealSize)}
          subtitle="Based on closed-won deals"
          trend={'neutral'}
          onClick={() => setShowDealSizeChart(true)}
          isClickable={true}
        />

        <MetricCard
          title="Top Performer"
          value={bestPerformer?.sales_rep_name || 'N/A'}
          subtitle={bestPerformer ? `Revenue: ${formatCurrency(bestPerformer.revenue)}` : 'No data'}
          trend={getPerformanceTrend(bestPerformer?.percentTarget)}
          onClick={() => onMetricClick?.('bestPerformer')}
          isClickable={!!onMetricClick}
        />

        <MetricCard
          title="Avg. Activity / Rep"
          value={avgActivitiesPerRep?.toFixed(1) || 'N/A'}
          subtitle="(Calls, Emails, Meetings)"
          trend={'neutral'}
        />
      </div>
    </div>
  );
};
