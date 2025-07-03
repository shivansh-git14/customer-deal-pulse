
import { useState } from 'react';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics';
import { CriticalAlerts } from '@/components/dashboard/CriticalAlerts';
import { useDashboardData, DashboardFilters as FiltersType } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Index = () => {
  const [filters, setFilters] = useState<FiltersType>({
    startDate: '2023-01-01', // Set default to show existing data
    endDate: '2025-12-31'
  });
  const { data, loading, error } = useDashboardData(filters);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Sales RCA Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive overview of sales performance and metrics
            </p>
          </div>

          <div className="space-y-8">
            {/* Filters */}
            <div>
              {data ? (
                <DashboardFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableManagers={data.availableManagers}
                />
              ) : loading ? (
                <Skeleton className="h-40 w-full" />
              ) : null}
            </div>

            {/* Metrics */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : data ? (
                <OverviewMetrics data={data} />
              ) : null}
            </div>

            {/* Critical Alerts */}
            <div>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : data ? (
                <CriticalAlerts alerts={data.criticalAlerts} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
