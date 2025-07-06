import { TeamOverview } from '@/components/dashboard/TeamOverview';
import { useDashboard } from '@/contexts/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TeamView = () => {
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
        <TeamOverview filters={filters} />
      )}
    </div>
  );
};

export default TeamView;
