import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Heart, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface CustomerIntelligenceProps {
  data: DashboardData;
  filters: DashboardFilters;
}

export const CustomerIntelligence = ({ data }: CustomerIntelligenceProps) => {
  const { avgDealSize, criticalAlerts } = data;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Mock customer intelligence data - in real implementation, this would come from dedicated edge functions
  const customerSegments = [
    { segment: 'Enterprise', customers: 25, revenue: 850000, healthScore: 85, growth: 15 },
    { segment: 'Mid-Market', customers: 48, revenue: 720000, healthScore: 78, growth: 8 },
    { segment: 'SMB', customers: 95, revenue: 480000, healthScore: 72, growth: -2 },
    { segment: 'Startup', customers: 32, revenue: 320000, healthScore: 68, growth: 25 }
  ];

  const customerLifecycle = [
    { stage: 'Lead', count: 120, conversion: 35 },
    { stage: 'Prospect', count: 42, conversion: 60 },
    { stage: 'Opportunity', count: 25, conversion: 80 },
    { stage: 'Customer', count: 20, conversion: 100 },
    { stage: 'Advocate', count: 8, conversion: 100 }
  ];

  const topCustomers = [
    { name: 'TechCorp Inc.', revenue: 125000, health: 92, risk: 'Low', industry: 'Technology' },
    { name: 'Manufacturing Plus', revenue: 98000, health: 76, risk: 'Medium', industry: 'Manufacturing' },
    { name: 'Retail Giants', revenue: 87000, health: 85, risk: 'Low', industry: 'Retail' },
    { name: 'Healthcare Solutions', revenue: 76000, health: 65, risk: 'High', industry: 'Healthcare' }
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Segments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Customer Segments Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {customerSegments.map((segment, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{segment.segment}</h4>
                    <p className="text-sm text-muted-foreground">{segment.customers} customers</p>
                  </div>
                  <Badge variant={segment.growth > 0 ? "default" : "secondary"}>
                    {segment.growth > 0 ? '+' : ''}{segment.growth}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold">{formatCurrency(segment.revenue)}</p>
                  <div className="flex items-center gap-2">
                    <Heart className={`h-4 w-4 ${getHealthColor(segment.healthScore)}`} />
                    <span className="text-sm font-medium">{segment.healthScore}% Health</span>
                  </div>
                  <Progress value={segment.healthScore} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Lifecycle Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              Customer Lifecycle Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerLifecycle.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/5 rounded-md border border-secondary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stage.stage}</p>
                      <p className="text-sm text-muted-foreground">{stage.count} contacts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">{stage.conversion}%</p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              Revenue per Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-warning/5 rounded-lg border border-warning/20">
                <p className="text-3xl font-bold text-warning">{formatCurrency(avgDealSize)}</p>
                <p className="text-sm text-muted-foreground">Average Revenue per Customer</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-primary/5 rounded border border-primary/10">
                  <span className="text-sm">Top 20% Customers</span>
                  <span className="font-semibold">{formatCurrency(avgDealSize * 3.2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary/5 rounded border border-secondary/10">
                  <span className="text-sm">Middle 60% Customers</span>
                  <span className="font-semibold">{formatCurrency(avgDealSize)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/20 rounded border">
                  <span className="text-sm">Bottom 20% Customers</span>
                  <span className="font-semibold">{formatCurrency(avgDealSize * 0.3)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Health Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            Customer Health & Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topCustomers.map((customer, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{customer.name}</h4>
                    <p className="text-sm text-muted-foreground">{customer.industry}</p>
                  </div>
                  <Badge variant={getRiskBadgeVariant(customer.risk)}>
                    {customer.risk} Risk
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revenue</span>
                    <span className="font-semibold">{formatCurrency(customer.revenue)}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-1">
                        <Heart className={`h-3 w-3 ${getHealthColor(customer.health)}`} />
                        Health Score
                      </span>
                      <span className={`text-sm font-medium ${getHealthColor(customer.health)}`}>
                        {customer.health}%
                      </span>
                    </div>
                    <Progress value={customer.health} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};