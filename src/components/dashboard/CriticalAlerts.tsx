
import { AlertTriangle, DollarSign, User, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const getDealStageColor = (stage: string) => {
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('won') || lowerStage.includes('closed')) return 'bg-green-100 text-green-800';
    if (lowerStage.includes('proposal') || lowerStage.includes('negotiation')) return 'bg-yellow-100 text-yellow-800';
    if (lowerStage.includes('qualified') || lowerStage.includes('discovery')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <AlertTriangle className="h-5 w-5" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">No Critical Alerts</p>
            <p className="text-sm">All deals are currently low risk</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Critical Alerts
          <Badge variant="destructive" className="ml-2">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.deal_id}
              className="border border-red-200 rounded-lg p-4 bg-red-50/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-gray-900">
                    Deal #{alert.deal_id}
                  </span>
                  <Badge className={getDealStageColor(alert.deal_stage)}>
                    {alert.deal_stage}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-red-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(alert.revenueAtRisk)}
                  </div>
                  <div className="text-xs text-muted-foreground">Revenue at Risk</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{alert.customer_name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Sales Rep
                  </div>
                  <div className="font-medium">{alert.sales_rep_name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
