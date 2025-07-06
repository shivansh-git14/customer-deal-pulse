
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

import { Navigate } from "react-router-dom";

const Index = () => <Navigate to="/overview" replace />;

export default Index;
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

                  {/* Critical Alerts */}
                  <div className="lg:col-span-1">
                    {loading ? (
                      <Skeleton className="h-44 w-full rounded-xl" />
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
