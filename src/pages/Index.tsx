
import { useState } from 'react';
import { EnhancedFilters } from '@/components/dashboard/EnhancedFilters';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { useDashboardData, DashboardFilters as FiltersType } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3 } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Sales RCA Dashboard
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive overview of sales performance with real-time analytics and insights
            </p>
          </div>

          <div className="space-y-6">
            {/* Enhanced Filters */}
            <div>
              {data ? (
                <EnhancedFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableManagers={data.availableManagers}
                />
              ) : loading ? (
                <Skeleton className="h-32 w-full rounded-lg" />
              ) : null}
            </div>

            {/* Dashboard Tabs */}
            <div>
              {loading ? (
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </div>
                  <Skeleton className="h-64 w-full rounded-lg" />
                </div>
              ) : data ? (
                <DashboardTabs data={data} filters={filters} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
