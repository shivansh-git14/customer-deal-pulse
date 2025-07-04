
import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { RevenueChartModal } from './RevenueChartModal';
import { DealSizeChartModal } from './DealSizeChartModal';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface OverviewMetricsProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const OverviewMetrics = ({ data, filters }: OverviewMetricsProps) => {
  const { overallRevenue, bestPerformer, avgDealSize } = data;
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showDealSizeChart, setShowDealSizeChart] = useState(false);

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
    <div className="space-y-8">
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
      
      {/* Enhanced metric cards with modern styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Revenue - Enhanced */}
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(overallRevenue.total)}
          subtitle={`${formatPercentage(overallRevenue.completionPercentage)} of target (${formatCurrency(overallRevenue.target)})`}
          trend={getCompletionTrend(overallRevenue.completionPercentage)}
          onClick={() => setShowRevenueChart(true)}
          isClickable={true}
          className="bg-gradient-to-br from-card to-card/80 border-primary/20 hover:border-primary/40 transition-all duration-300"
        />
        
        {/* Average Deal Size - Enhanced */}
        <MetricCard
          title="Avg Deal Size"
          value={formatCurrency(avgDealSize)}
          subtitle="Across all closed deals"
          trend="neutral"
          onClick={() => setShowDealSizeChart(true)}
          isClickable={true}
          className="bg-gradient-to-br from-card to-card/80 border-accent/20 hover:border-accent/40 transition-all duration-300"
        />

        {/* Best Performer - Enhanced */}
        <MetricCard
          title="Top Performer"
          value={bestPerformer ? bestPerformer.sales_rep_name : 'No data'}
          subtitle={bestPerformer 
            ? `${formatPercentage(bestPerformer.percentTarget)} of target (${formatCurrency(bestPerformer.revenue)})`
            : 'No performance data available'
          }
          trend={bestPerformer ? getPerformanceTrend(bestPerformer.percentTarget) : undefined}
          className="bg-gradient-to-br from-card to-card/80 border-success/20 hover:border-success/40 transition-all duration-300"
        />
      </div>
    </div>
  );
};
