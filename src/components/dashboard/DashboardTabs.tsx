import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Target } from 'lucide-react';
import { ExecutiveOverview } from './tabs/ExecutiveOverview';
import { SalesOperations } from './tabs/SalesOperations';
import { CustomerIntelligence } from './tabs/CustomerIntelligence';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface DashboardTabsProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const DashboardTabs = ({ data, filters }: DashboardTabsProps) => {
  return (
    <Tabs defaultValue="executive" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger 
          value="executive" 
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <BarChart3 className="h-4 w-4" />
          Executive Overview
        </TabsTrigger>
        <TabsTrigger 
          value="operations" 
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Target className="h-4 w-4" />
          Sales Operations
        </TabsTrigger>
        <TabsTrigger 
          value="customers" 
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Users className="h-4 w-4" />
          Customer Intelligence
        </TabsTrigger>
      </TabsList>

      <TabsContent value="executive" className="space-y-6">
        <ExecutiveOverview data={data} filters={filters} />
      </TabsContent>

      <TabsContent value="operations" className="space-y-6">
        <SalesOperations data={data} filters={filters} />
      </TabsContent>

      <TabsContent value="customers" className="space-y-6">
        <CustomerIntelligence data={data} filters={filters} />
      </TabsContent>
    </Tabs>
  );
};