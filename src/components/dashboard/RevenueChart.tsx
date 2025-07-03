import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';

interface RevenueChartProps {
  filters: DashboardFilters;
  onClose: () => void;
}

interface WeeklyData {
  week: string;
  revenue: number;
  target: number;
  dealVolume: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  target: {
    label: "Target", 
    color: "hsl(var(--secondary-foreground))",
  },
  dealVolume: {
    label: "Deal Volume",
    color: "hsl(var(--accent-foreground))",
  },
};

export const RevenueChart = ({ filters, onClose }: RevenueChartProps) => {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // Group data by week
        const weeklyMap = new Map<string, { revenue: number; target: number; dealVolume: number }>();

        // Process revenue data by week
        filteredRevenueData.forEach(item => {
          const date = new Date(item.participation_dt);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekKey = weekStart.toISOString().split('T')[0];
          
          const existing = weeklyMap.get(weekKey) || { revenue: 0, target: 0, dealVolume: 0 };
          existing.revenue += Number(item.revenue) || 0;
          existing.dealVolume += 1;
          weeklyMap.set(weekKey, existing);
        });

        // Process targets data by week
        filteredTargetsData.forEach(item => {
          const date = new Date(item.target_month);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          
          const existing = weeklyMap.get(weekKey) || { revenue: 0, target: 0, dealVolume: 0 };
          existing.target += Number(item.target_value) || 0;
          weeklyMap.set(weekKey, existing);
        });

        // Convert to array and sort by week
        const chartData = Array.from(weeklyMap.entries())
          .map(([week, values]) => ({
            week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ...values
          }))
          .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

        setData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [filters]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Revenue Trend Analysis</CardTitle>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-sm transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="currency"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="volume"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    labelFormatter={(value) => `Week of ${value}`}
                    formatter={(value, name) => [
                      name === 'dealVolume' ? value : formatCurrency(Number(value)),
                      name === 'dealVolume' ? 'Deal Volume' : name === 'revenue' ? 'Revenue' : 'Target'
                    ]}
                  />
                }
              />
              <Legend />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-revenue)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-revenue)", strokeWidth: 2 }}
              />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="target" 
                stroke="var(--color-target)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "var(--color-target)", strokeWidth: 2, r: 3 }}
              />
              <Bar 
                yAxisId="volume"
                dataKey="dealVolume" 
                fill="var(--color-dealVolume)"
                opacity={0.6}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};