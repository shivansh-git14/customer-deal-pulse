import { useState } from 'react';
import { DateRangeSlider } from '@/components/dashboard/DateRangeSlider';
import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics';
import { CriticalAlerts } from '@/components/dashboard/CriticalAlerts';
import { TeamOverview } from '@/components/dashboard/TeamOverview';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { useDashboardData, DashboardFilters as FiltersType } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Trophy } from 'lucide-react';

const Index = () => {
  const [filters, setFilters] = useState<FiltersType>({});
  const { data, loading, error } = useDashboardData(filters);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Sales RCA Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Real-time insights into sales performance and critical deals</p>
        </header>

        <div className="bg-card p-6 rounded-2xl shadow-lg border">
          <DateRangeSlider 
            filters={filters}
            onFiltersChange={setFilters} 
            availableManagers={data?.availableManagers || []}
          />
        </div>

        <div className="mt-8">
          {error ? (
            <Alert variant="destructive" className="mb-8">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team Performance</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {loading ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                      </div>
                      <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                  ) : data ? (
                    <OverviewMetrics data={data} filters={filters} />
                  ) : null}
                </div>

                <div className="lg:col-span-1">
                  {loading ? (
                    <Skeleton className="h-44 w-full rounded-xl" />
                  ) : data ? (
                    <CriticalAlerts alerts={data.criticalAlerts} />
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team">
              {loading ? (
                <Skeleton className="h-96 w-full rounded-xl" />
              ) : (
                <TeamOverview filters={filters} />
              )}
            </TabsContent>

            <TabsContent value="leaderboard">
              <Leaderboard filters={filters} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
