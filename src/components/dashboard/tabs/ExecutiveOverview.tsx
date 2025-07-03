import { MetricCard } from '../MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface ExecutiveOverviewProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const ExecutiveOverview = ({ data }: ExecutiveOverviewProps) => {
  const { overallRevenue, bestPerformer, avgDealSize, criticalAlerts } = data;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getCompletionTrend = (percentage: number) => {
    if (percentage >= 100) return 'up';
    if (percentage >= 80) return 'neutral';
    return 'down';
  };

  const pipelineHealthScore = Math.min(100, (overallRevenue.completionPercentage + (bestPerformer?.percentTarget || 0)) / 2);

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(overallRevenue.total)}
          subtitle={`${overallRevenue.completionPercentage.toFixed(1)}% of target`}
          trend={getCompletionTrend(overallRevenue.completionPercentage)}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
        />
        
        <MetricCard
          title="Pipeline Health Score"
          value={`${pipelineHealthScore.toFixed(0)}%`}
          subtitle="Overall pipeline strength"
          trend={pipelineHealthScore >= 80 ? 'up' : pipelineHealthScore >= 60 ? 'neutral' : 'down'}
          icon={<Target className="h-5 w-5 text-secondary" />}
          className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20"
        />
        
        <MetricCard
          title="Average Deal Size"
          value={formatCurrency(avgDealSize)}
          subtitle="Per closed deal"
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-warning" />}
          className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20"
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestPerformer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{bestPerformer.sales_rep_name}</h3>
                    <p className="text-sm text-muted-foreground">Sales Representative</p>
                  </div>
                  <Badge variant={bestPerformer.percentTarget >= 100 ? "default" : "secondary"}>
                    {bestPerformer.percentTarget.toFixed(1)}% of target
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Revenue: {formatCurrency(bestPerformer.revenue)}</span>
                    <span>Target: {formatCurrency(bestPerformer.target)}</span>
                  </div>
                  <Progress value={Math.min(100, bestPerformer.percentTarget)} className="h-2" />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No performance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Critical Alerts Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Critical Alerts
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {criticalAlerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalAlerts.length > 0 ? (
              <div className="space-y-3">
                {criticalAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-accent/10 rounded-md border border-accent/20">
                    <div>
                      <p className="font-medium text-sm">{alert.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{alert.deal_stage}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-accent">
                        {formatCurrency(alert.revenueAtRisk)}
                      </p>
                      <p className="text-xs text-muted-foreground">at risk</p>
                    </div>
                  </div>
                ))}
                {criticalAlerts.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{criticalAlerts.length - 3} more alerts
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 text-green-500 mr-2" />
                <span>All deals on track</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Revenue Target Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(overallRevenue.total)}</p>
                <p className="text-sm text-muted-foreground">
                  of {formatCurrency(overallRevenue.target)} target
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">
                  {overallRevenue.completionPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={Math.min(100, overallRevenue.completionPercentage)} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>{formatCurrency(overallRevenue.target)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};