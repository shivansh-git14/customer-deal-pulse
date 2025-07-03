
import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { RevenueChart } from './RevenueChart';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface OverviewMetricsProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const OverviewMetrics = ({ data, filters }: OverviewMetricsProps) => {
  const { overallRevenue, bestPerformer, avgDealSize } = data;
  const [showRevenueChart, setShowRevenueChart] = useState(false);

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

  const getPerformanceTrend = (percentTarget: number) => {
    if (percentTarget >= 100) return 'up';
    if (percentTarget >= 80) return 'neutral';
    return 'down';
  };

  return (
    <div className="space-y-6">
      {showRevenueChart && (
        <RevenueChart 
          filters={filters} 
          onClose={() => setShowRevenueChart(false)} 
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Revenue */}
        <div className="space-y-4">
          <MetricCard
            title="Overall Revenue"
            value={formatCurrency(overallRevenue.total)}
            subtitle={`${formatPercentage(overallRevenue.completionPercentage)} of target (${formatCurrency(overallRevenue.target)})`}
            trend={getCompletionTrend(overallRevenue.completionPercentage)}
            onClick={() => setShowRevenueChart(true)}
            isClickable={true}
          />
          
          {/* Average Deal Size */}
          <MetricCard
            title="Average Deal Size"
            value={formatCurrency(avgDealSize)}
            subtitle="Across all closed deals"
            trend="neutral"
          />
        </div>

        {/* Best Performer */}
        <MetricCard
          title="Best Performer"
          value={bestPerformer ? bestPerformer.sales_rep_name : 'No data'}
          subtitle={bestPerformer 
            ? `${formatPercentage(bestPerformer.percentTarget)} of target (${formatCurrency(bestPerformer.revenue)}/${formatCurrency(bestPerformer.target)})`
            : 'No performance data available'
          }
          trend={bestPerformer ? getPerformanceTrend(bestPerformer.percentTarget) : undefined}
        />
      </div>
    </div>
  );
};
