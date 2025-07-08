import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CriticalAlert } from '@/hooks/useDashboardData';

interface AlertCardProps {
  alert: CriticalAlert;
}

// This can be expanded with more details if needed
const AlertCard = ({ alert }: AlertCardProps) => (
  <div className="p-3 bg-background rounded-lg border">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-semibold text-sm">{alert.customer_name}</p>
        <p className="text-xs text-muted-foreground">Rep: {alert.sales_rep_name}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-destructive text-sm">${alert.revenueAtRisk.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">At Risk</p>
      </div>
    </div>
  </div>
);

interface AlertCategoryCardProps {
  title: string;
  alerts: CriticalAlert[];
}

export const AlertCategoryCard = ({ title, alerts }: AlertCategoryCardProps) => {
  const [showAll, setShowAll] = useState(false);
  const visibleAlerts = showAll ? alerts : alerts.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <span className="text-lg font-bold text-destructive">{alerts.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No alerts in this category.</p>
        ) : (
          visibleAlerts.map(alert => <AlertCard key={alert.deal_id} alert={alert} />)
        )}
      </CardContent>
      {alerts.length > 3 && (
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'View Less' : `View ${alerts.length - 3} More`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
