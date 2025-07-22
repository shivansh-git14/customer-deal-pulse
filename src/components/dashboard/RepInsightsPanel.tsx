import { Card, CardContent } from '@/components/ui/card';
import { DashboardFilters } from '@/hooks/useDashboardData';

interface RepInsightsPanelProps {
  teamName: string;
  filters: DashboardFilters;
}

export const RepInsightsPanel = ({ teamName, filters }: RepInsightsPanelProps) => {
  // Placeholder for future insights content. 
  // The teamName and filters props are now available for future use.

  return (
    <Card className="my-2 bg-muted/30 border-none shadow-none">
      <CardContent>
        <div className="text-muted-foreground italic py-6 text-center">
          Insights will appear here in the future.
        </div>
      </CardContent>
    </Card>
  );
};
