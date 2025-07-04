
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { CriticalAlert } from '@/hooks/useDashboardData';

interface CriticalAlertsProps {
  alerts: CriticalAlert[];
}

export const CriticalAlerts = ({ alerts }: CriticalAlertsProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const totalAtRisk = alerts.reduce((sum, alert) => sum + alert.revenueAtRisk, 0);

  return (
    <Card className="h-fit border-0 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle className="text-lg font-semibold">Critical Alerts</CardTitle>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="font-medium text-destructive">{formatCurrency(totalAtRisk)} at risk</span>
            <span className="text-muted-foreground">• {alerts.length} deals</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">
              No critical alerts
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All deals are performing well
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.deal_id}
              className="p-4 rounded-lg border border-destructive/10 bg-destructive/5 hover:bg-destructive/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground">{alert.customer_name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rep: {alert.sales_rep_name}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs border-destructive/20 text-destructive">
                  {alert.deal_stage}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Revenue at Risk</span>
                <span className="font-bold text-destructive">
                  {formatCurrency(alert.revenueAtRisk)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
