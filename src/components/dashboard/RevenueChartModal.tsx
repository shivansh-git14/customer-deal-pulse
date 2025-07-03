import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilters;
}

interface MonthlyData {
  month: string;
  revenue: number;
  target: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-primary))",
  },
  target: {
    label: "Target", 
    color: "hsl(var(--chart-secondary))",
  },
};

export const RevenueChartModal = ({ isOpen, onClose, filters }: RevenueChartModalProps) => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        // Get revenue data
        let revenueQuery = supabase
          .from('revenue')
          .select('revenue, sales_rep, participation_dt');
        
        if (filters.startDate) {
          revenueQuery = revenueQuery.gte('participation_dt', filters.startDate);
        }
        if (filters.endDate) {
          revenueQuery = revenueQuery.lte('participation_dt', filters.endDate);
        }

        const { data: revenueData } = await revenueQuery;

        // Get targets data
        let targetsQuery = supabase
          .from('targets')
          .select('target_value, sales_rep_id, target_month');
        
        if (filters.startDate) {
          targetsQuery = targetsQuery.gte('target_month', filters.startDate);
        }
        if (filters.endDate) {
          targetsQuery = targetsQuery.lte('target_month', filters.endDate);
        }

        const { data: targetsData } = await targetsQuery;

        // Filter by sales manager if specified
        let filteredRevenueData = revenueData || [];
        let filteredTargetsData = targetsData || [];

        if (filters.salesManagerId) {
          const { data: teamReps } = await supabase
            .from('sales_reps')
            .select('sales_rep_id')
            .eq('sales_rep_manager_id', filters.salesManagerId);
          
          const teamRepIds = teamReps?.map(rep => rep.sales_rep_id) || [];
          
          if (teamRepIds.length > 0) {
            filteredRevenueData = filteredRevenueData.filter(rev => teamRepIds.includes(rev.sales_rep));
            filteredTargetsData = filteredTargetsData.filter(target => teamRepIds.includes(target.sales_rep_id));
          }
        }

        // Group data by month
        const monthlyMap = new Map<string, { revenue: number; target: number }>();

        // Process revenue data by month
        filteredRevenueData.forEach(item => {
          const date = new Date(item.participation_dt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const existing = monthlyMap.get(monthKey) || { revenue: 0, target: 0 };
          existing.revenue += Number(item.revenue) || 0;
          monthlyMap.set(monthKey, existing);
        });

        // Process targets data by month
        filteredTargetsData.forEach(item => {
          const date = new Date(item.target_month);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const existing = monthlyMap.get(monthKey) || { revenue: 0, target: 0 };
          existing.target += Number(item.target_value) || 0;
          monthlyMap.set(monthKey, existing);
        });

        // Convert to array and sort by month
        const chartData = Array.from(monthlyMap.entries())
          .map(([month, values]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            ...values
          }))
          .sort((a, b) => new Date(a.month + ' 01').getTime() - new Date(b.month + ' 01').getTime());

        setData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [filters, isOpen]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Revenue Trend Analysis
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <ChartContainer config={chartConfig} className="min-h-[400px]">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-secondary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-secondary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCurrency}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        className="bg-background/90 backdrop-blur border border-border/50 shadow-lg"
                        labelFormatter={(value) => `Month: ${value}`}
                        formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Revenue' : 'Target']}
                      />
                    }
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-primary))", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: "hsl(var(--chart-primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--chart-secondary))" 
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={{ fill: "hsl(var(--chart-secondary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "hsl(var(--chart-secondary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};