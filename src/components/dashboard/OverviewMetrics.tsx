
import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { RevenueChartModal } from './RevenueChartModal';
import { DealSizeChartModal } from './DealSizeChartModal';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface OverviewMetricsProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const OverviewMetrics = ({ data, filters }: OverviewMetricsProps) => {
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showDealSizeChart, setShowDealSizeChart] = useState(false);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.overallRevenue.total)}
          subtitle={`Target: ${formatCurrency(data.overallRevenue.target)}`}
          trend={data.overallRevenue.completionPercentage >= 100 ? 'up' : 'down'}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          onClick={() => setShowRevenueChart(true)}
          isClickable={true}
        />
        
        <MetricCard
          title="Target Achievement"
          value={`${data.overallRevenue.completionPercentage.toFixed(1)}%`}
          subtitle={data.overallRevenue.completionPercentage >= 100 ? 'Target exceeded' : 'Below target'}
          trend={data.overallRevenue.completionPercentage >= 100 ? 'up' : 'down'}
          icon={<Target className="h-5 w-5 text-success" />}
        />

        <MetricCard
          title="Best Performer"
          value={data.bestPerformer ? data.bestPerformer.sales_rep_name : 'N/A'}
          subtitle={data.bestPerformer ? `${data.bestPerformer.percentTarget.toFixed(1)}% of target` : 'No data available'}
          trend={data.bestPerformer && data.bestPerformer.percentTarget >= 100 ? 'up' : 'down'}
          icon={<Users className="h-5 w-5 text-secondary" />}
        />
      </div>

      <MetricCard
        title="Average Deal Size"
        value={formatCurrency(data.avgDealSize)}
        subtitle="Per closed deal"
        trend="neutral"
        icon={<TrendingUp className="h-5 w-5 text-accent" />}
        onClick={() => setShowDealSizeChart(true)}
        isClickable={true}
      />

      {/* Chart Modals */}
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
    </div>
  );
};
