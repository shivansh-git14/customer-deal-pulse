
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeSlider } from '@/components/dashboard/DateRangeSlider';
import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics';
import { CriticalAlerts } from '@/components/dashboard/CriticalAlerts';
import { TeamOverview } from '@/components/dashboard/TeamOverview';
import { useDashboardData, DashboardFilters as FiltersType } from '@/hooks/useDashboardData';
import { useTeamData } from '@/hooks/useTeamData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, Users } from 'lucide-react';

const Index = () => {
  const [filters, setFilters] = useState<FiltersType>({
    startDate: '2023-01-01',
    endDate: '2025-12-31'
  });
  
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardData(filters);
  const { data: teamData, loading: teamLoading, error: teamError } = useTeamData(filters);

  const error = dashboardError || teamError;

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales RCA Dashboard</h1>
              <p className="text-muted-foreground">Real-time sales performance analytics and insights</p>
            </div>
          </div>

          {/* Filters */}
          {dashboardData ? (
            <DateRangeSlider
              filters={filters}
              onFiltersChange={setFilters}
              availableManagers={dashboardData.availableManagers}
            />
          ) : dashboardLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : null}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                {dashboardLoading ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  </div>
                ) : dashboardData ? (
                  <OverviewMetrics data={dashboardData} filters={filters} />
                ) : null}
              </div>

              <div className="xl:col-span-1">
                {dashboardLoading ? (
                  <Skeleton className="h-96 w-full rounded-lg" />
                ) : dashboardData ? (
                  <CriticalAlerts alerts={dashboardData.criticalAlerts} />
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team">
            {teamLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <Skeleton className="h-96 w-full rounded-lg" />
              </div>
            ) : teamData ? (
              <TeamOverview data={teamData} />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
