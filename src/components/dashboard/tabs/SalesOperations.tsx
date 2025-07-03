import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Target, TrendingUp, Activity } from 'lucide-react';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface SalesOperationsProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const SalesOperations = ({ data }: SalesOperationsProps) => {
  const { bestPerformer, avgDealSize, criticalAlerts } = data;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Mock data for sales operations - in real implementation, this would come from dedicated edge functions
  const mockReps = [
    { name: bestPerformer?.sales_rep_name || 'John Doe', revenue: bestPerformer?.revenue || 150000, target: bestPerformer?.target || 200000, deals: 12, activities: 45 },
    { name: 'Jane Smith', revenue: 135000, target: 180000, deals: 10, activities: 38 },
    { name: 'Mike Johnson', revenue: 120000, target: 160000, deals: 8, activities: 42 },
    { name: 'Sarah Wilson', revenue: 98000, target: 150000, deals: 6, activities: 35 }
  ];

  const mockStages = [
    { stage: 'Prospecting', deals: 25, value: 850000 },
    { stage: 'Qualification', deals: 18, value: 720000 },
    { stage: 'Proposal', deals: 12, value: 480000 },
    { stage: 'Negotiation', deals: 8, value: 320000 },
    { stage: 'Closed Won', deals: 15, value: 600000 }
  ];

  return (
    <div className="space-y-6">
      {/* Sales Team Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Sales Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReps.map((rep, index) => {
              const percentage = (rep.revenue / rep.target) * 100;
              return (
                <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{rep.name}</h4>
                      <p className="text-sm text-muted-foreground">{rep.deals} active deals</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={percentage >= 100 ? "default" : percentage >= 75 ? "secondary" : "outline"}>
                        {percentage.toFixed(1)}%
                      </Badge>
                      <p className="text-sm text-muted-foreground">{rep.activities} activities</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(rep.revenue)}</span>
                      <span>{formatCurrency(rep.target)}</span>
                    </div>
                    <Progress value={Math.min(100, percentage)} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStages.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/5 rounded-md border border-secondary/10">
                  <div>
                    <p className="font-medium">{stage.stage}</p>
                    <p className="text-sm text-muted-foreground">{stage.deals} deals</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(stage.value)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(stage.value / stage.deals)} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-warning" />
              Deal Size Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-warning/5 rounded-lg border border-warning/20">
                <p className="text-3xl font-bold text-warning">{formatCurrency(avgDealSize)}</p>
                <p className="text-sm text-muted-foreground">Average Deal Size</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-md border border-primary/10">
                  <p className="text-lg font-semibold">{formatCurrency(avgDealSize * 1.3)}</p>
                  <p className="text-xs text-muted-foreground">Large Deals (30%)</p>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-md border border-secondary/10">
                  <p className="text-lg font-semibold">{formatCurrency(avgDealSize * 0.7)}</p>
                  <p className="text-xs text-muted-foreground">Small Deals (70%)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Deal Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Deals Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{alert.customer_name}</h4>
                      <p className="text-sm text-muted-foreground">{alert.sales_rep_name}</p>
                    </div>
                    <Badge variant="destructive">{alert.deal_stage}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent">{formatCurrency(alert.revenueAtRisk)}</p>
                    <p className="text-xs text-muted-foreground">Revenue at Risk</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>All deals are progressing well</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};