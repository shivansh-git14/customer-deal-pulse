
import { useState } from 'react';
import { DateRangeSlider } from '@/components/dashboard/DateRangeSlider';
import { OverviewMetrics } from '@/components/dashboard/OverviewMetrics';
import { CriticalAlerts } from '@/components/dashboard/CriticalAlerts';
import { TeamOverview } from '@/components/dashboard/TeamOverview';
import { useDashboardData, DashboardFilters as FiltersType } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Sales Analytics
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced sales performance insights with real-time analytics and predictive intelligence
            </p>
          </div>

          <div className="space-y-8">
            {/* Filters Section */}
            <div className="backdrop-blur-sm">
              {data ? (
                <DateRangeSlider
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableManagers={data.availableManagers}
                />
              ) : loading ? (
                <Skeleton className="h-40 w-full rounded-xl" />
              ) : null}
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-card border shadow-sm">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <TrendingUp className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-4 w-4" />
                  Team Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Enhanced Metrics - Takes up 2/3 of the width */}
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

                  {/* Critical Alerts - Unchanged as requested */}
                  <div className="lg:col-span-1">
                    {loading ? (
                      <Skeleton className="h-96 w-full rounded-xl" />
                    ) : data ? (
                      <CriticalAlerts alerts={data.criticalAlerts} />
                    ) : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-8">
                {loading ? (
                  <Skeleton className="h-96 w-full rounded-xl" />
                ) : (
                  <TeamOverview filters={filters} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
