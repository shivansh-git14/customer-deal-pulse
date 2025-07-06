import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics';
import { CriticalAlerts } from '@/components/dashboard/CriticalAlerts';
import { useDashboard } from '@/contexts/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OverviewView = () => {
  const { data, loading, error, filters } = useDashboard();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {loading || !data ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <OverviewMetrics data={data} filters={filters} />
      )}
      {loading || !data ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <CriticalAlerts alerts={data.criticalAlerts} />
      )}
    </div>
  );
};

export default OverviewView;
