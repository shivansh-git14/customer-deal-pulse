
import { AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CriticalAlert } from '@/hooks/useDashboardData';

interface CriticalAlertsProps {
  alerts: CriticalAlert[];
}

export const CriticalAlerts = ({ alerts }: CriticalAlertsProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const totalAtRisk = alerts.reduce((sum, alert) => sum + alert.revenueAtRisk, 0);

  return (
    <Card className="w-full h-fit border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">Critical Alerts</span>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-destructive" />
              <span className="font-bold text-destructive">
                {formatCurrency(totalAtRisk)}
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
            <AlertTriangle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200">
              No critical alerts. All deals are tracking well!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.slice(0, 8).map((alert, index) => (
              <Alert key={alert.deal_id} variant="destructive" className="border-l-4 border-l-destructive transition-all hover:shadow-sm border-destructive/30 bg-destructive/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <TrendingDown className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {alert.customer_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{alert.sales_rep_name}</span> • {alert.deal_stage}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-bold text-destructive text-sm">
                      {formatCurrency(alert.revenueAtRisk)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      at risk
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
            {alerts.length > 8 && (
              <div className="text-center text-xs text-muted-foreground pt-2">
                +{alerts.length - 8} more alerts
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
