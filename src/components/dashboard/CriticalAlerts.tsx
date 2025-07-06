
import { AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CriticalAlert } from '@/hooks/useDashboardData';

interface CriticalAlertsProps {
  alerts: CriticalAlert[];
}

import { useState } from 'react';

interface ExpandableAlertCardProps {
  alert: CriticalAlert;
}

const ExpandableAlertCard = ({ alert }: ExpandableAlertCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };
  return (
    <Alert
      variant="destructive"
      className="border-l-4 border-l-destructive transition-all hover:shadow-sm border-destructive/30 bg-destructive/10 cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          <TrendingDown className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{alert.customer_name}</div>
            {/* Collapsed: hide rep/stage. Expanded: show details */}
            {expanded && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div><span className="font-medium">Sales Rep:</span> {alert.sales_rep_name}</div>
                <div><span className="font-medium">Deal Stage:</span> {alert.deal_stage}</div>
                {alert.sales_manager && (
                  <div><span className="font-medium">Sales Manager:</span> {alert.sales_manager}</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <div className="font-bold text-destructive text-sm">{formatCurrency(alert.revenueAtRisk)}</div>
          <div className="text-xs text-muted-foreground">at risk</div>
        </div>
      </div>
    </Alert>
  );
};

interface AllAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: CriticalAlert[];
}

const AllAlertsModal = ({ isOpen, onClose, alerts }: AllAlertsModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative">
        <button
          className="absolute top-3 right-3 text-lg text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" /> All High-Risk Deals
        </h2>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert
              key={alert.deal_id}
              variant="destructive"
              className="border-l-4 border-l-destructive transition-all hover:shadow-sm border-destructive/30 bg-destructive/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <TrendingDown className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{alert.customer_name}</div>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div><span className="font-medium">Sales Rep:</span> {alert.sales_rep_name}</div>
                      <div><span className="font-medium">Deal Stage:</span> {alert.deal_stage}</div>
                      {alert.sales_manager && (
                        <div><span className="font-medium">Sales Manager:</span> {alert.sales_manager}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-bold text-destructive text-sm">{(
                    (amount => {
                      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
                      if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
                      return `$${amount.toLocaleString()}`;
                    })(alert.revenueAtRisk)
                  )}</div>
                  <div className="text-xs text-muted-foreground">at risk</div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CriticalAlerts = ({ alerts }: CriticalAlertsProps) => {
  const [showAll, setShowAll] = useState(false);
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
            {/* Expandable Cards: Only show customer name and at-risk amount collapsed, expand for more */}
            {alerts.slice(0, 3).map((alert, index) => (
              <ExpandableAlertCard key={alert.deal_id} alert={alert} />
            ))}
            {/* View More Button if more than 3 alerts */}
            {alerts.length > 3 && (
              <div className="text-center pt-2">
                <button
                  className="text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  onClick={() => setShowAll(true)}
                >
                  View More
                </button>
                <AllAlertsModal
                  isOpen={showAll}
                  onClose={() => setShowAll(false)}
                  alerts={alerts}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
