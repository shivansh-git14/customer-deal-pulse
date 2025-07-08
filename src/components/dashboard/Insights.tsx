import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export const Insights = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Actionable insights and trends will be displayed here to help guide your sales strategy.
        </p>
        {/* Placeholder for future content */}
      </CardContent>
    </Card>
  );
};
