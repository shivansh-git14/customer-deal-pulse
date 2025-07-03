
import { FileText, Database, Calculator, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Metric {
  name: string;
  description: string;
  source: string[];
  calculation: string;
  category: 'Revenue' | 'Performance' | 'Risk' | 'Activity';
}

export const MetricsDocumentation = () => {
  const metrics: Metric[] = [
    {
      name: "Overall Revenue",
      description: "Total revenue generated within the selected time period",
      source: ["revenue table"],
      calculation: "SUM(revenue.revenue) WHERE participation_dt BETWEEN start_date AND end_date",
      category: "Revenue"
    },
    {
      name: "Target Completion %",
      description: "Percentage of revenue target achieved",
      source: ["revenue table", "targets table"],
      calculation: "(Total Revenue / Total Target) × 100",
      category: "Performance"
    },
    {
      name: "Best Performer",
      description: "Sales representative with highest % target achievement",
      source: ["revenue table", "targets table", "sales_reps table"],
      calculation: "MAX((Individual Revenue / Individual Target) × 100) by sales_rep",
      category: "Performance"
    },
    {
      name: "Average Deal Size",
      description: "Mean revenue value per closed deal",
      source: ["revenue table"],
      calculation: "AVG(revenue.revenue) for the selected period",
      category: "Revenue"
    },
    {
      name: "Critical Alerts",
      description: "High-risk deals sorted by potential revenue impact",
      source: ["deals_current table", "sales_reps table", "customers table"],
      calculation: "SELECT deals WHERE is_high_risk = 'Yes' ORDER BY max_deal_potential DESC",
      category: "Risk"
    },
    {
      name: "Revenue at Risk",
      description: "Maximum potential revenue from high-risk deals",
      source: ["deals_current table"],
      calculation: "max_deal_potential value for deals marked as high risk",
      category: "Risk"
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Revenue': return 'bg-green-100 text-green-800';
      case 'Performance': return 'bg-blue-100 text-blue-800';
      case 'Risk': return 'bg-red-100 text-red-800';
      case 'Activity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Revenue': return <TrendingUp className="h-4 w-4" />;
      case 'Performance': return <Calculator className="h-4 w-4" />;
      case 'Risk': return <FileText className="h-4 w-4" />;
      case 'Activity': return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dashboard Metrics Documentation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(metric.category)}
                  <div>
                    <h3 className="font-semibold text-lg">{metric.name}</h3>
                    <p className="text-muted-foreground text-sm">{metric.description}</p>
                  </div>
                </div>
                <Badge className={getCategoryColor(metric.category)}>
                  {metric.category}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    Data Sources
                  </div>
                  <div className="space-y-1">
                    {metric.source.map((source, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    Calculation Logic
                  </div>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    {metric.calculation}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Filter Application</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Time Period:</strong> All metrics respect the start/end date filters</li>
            <li>• <strong>Sales Manager:</strong> Data is filtered to show only team members under the selected manager</li>
            <li>• <strong>Best Performer:</strong> Now calculated based on % target achievement (revenue/target ratio)</li>
            <li>• <strong>Critical Alerts:</strong> High-risk deals are filtered by time period and manager, sorted by revenue at risk</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
