import { MetricCard } from './MetricCard';
import { DashboardData } from '@/hooks/useDashboardData';

interface OverviewMetricsProps {
  data: DashboardData;
}

export const OverviewMetrics = ({ data }: OverviewMetricsProps) => {
  const { overallRevenue, bestPerformer, avgDealSize } = data;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getCompletionTrend = (percentage: number) => {
    if (percentage >= 100) return 'up';
    if (percentage >= 80) return 'neutral';
    return 'down';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Overall Revenue */}
      <MetricCard
        title="Overall Revenue"
        value={formatCurrency(overallRevenue.total)}
        subtitle={`${formatPercentage(overallRevenue.completionPercentage)} of target (${formatCurrency(overallRevenue.target)})`}
        trend={getCompletionTrend(overallRevenue.completionPercentage)}
      />

      {/* Best Performer */}
      <MetricCard
        title="Best Performer"
        value={bestPerformer ? bestPerformer.sales_rep_name : 'No data'}
        subtitle={bestPerformer 
          ? `${formatPercentage(bestPerformer.conversionRate)} conversion rate (${bestPerformer.wonDeals}/${bestPerformer.totalDeals} deals won)`
          : 'No performance data available'
        }
        trend={bestPerformer && bestPerformer.conversionRate > 50 ? 'up' : bestPerformer ? 'neutral' : undefined}
      />

      {/* Average Deal Size */}
      <MetricCard
        title="Average Deal Size"
        value={formatCurrency(avgDealSize)}
        subtitle="Across all closed deals"
        trend="neutral"
      />
    </div>
  );
};