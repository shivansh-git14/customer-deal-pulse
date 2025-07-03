import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

interface DealSizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilters;
}

interface MonthlyDealData {
  month: string;
  [key: string]: string | number; // Dynamic deal stages
}

const DEAL_STAGE_COLORS = [
  "hsl(var(--chart-primary))",
  "hsl(var(--chart-secondary))", 
  "hsl(var(--chart-accent))",
  "hsl(var(--chart-warning))",
  "hsl(var(--destructive))",
];

export const DealSizeChartModal = ({ isOpen, onClose, filters }: DealSizeChartModalProps) => {
  const [data, setData] = useState<MonthlyDealData[]>([]);
  const [dealStages, setDealStages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        // Get deal historical data
        let dealsQuery = supabase
          .from('deal_historical')
          .select('deal_value, deal_stage, activity_date, sales_rep_id');
        
        if (filters.startDate) {
          dealsQuery = dealsQuery.gte('activity_date', filters.startDate);
        }
        if (filters.endDate) {
          dealsQuery = dealsQuery.lte('activity_date', filters.endDate);
        }

        const { data: dealsData } = await dealsQuery;

        // Filter by sales manager if specified
        let filteredDealsData = dealsData || [];

        if (filters.salesManagerId) {
          const { data: teamReps } = await supabase
            .from('sales_reps')
            .select('sales_rep_id')
            .eq('sales_rep_manager_id', filters.salesManagerId);
          
          const teamRepIds = teamReps?.map(rep => rep.sales_rep_id) || [];
          
          if (teamRepIds.length > 0) {
            filteredDealsData = filteredDealsData.filter(deal => teamRepIds.includes(deal.sales_rep_id));
          }
        }

        // Get unique deal stages
        const stages = [...new Set(filteredDealsData.map(deal => deal.deal_stage))];
        setDealStages(stages);

        // Group data by month and deal stage
        const monthlyMap = new Map<string, { [stage: string]: { totalValue: number; count: number } }>();

        filteredDealsData.forEach(deal => {
          if (!deal.deal_value) return;
          
          const date = new Date(deal.activity_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {});
          }
          
          const monthData = monthlyMap.get(monthKey)!;
          if (!monthData[deal.deal_stage]) {
            monthData[deal.deal_stage] = { totalValue: 0, count: 0 };
          }
          
          monthData[deal.deal_stage].totalValue += Number(deal.deal_value);
          monthData[deal.deal_stage].count += 1;
        });

        // Convert to array and calculate averages
        const chartData = Array.from(monthlyMap.entries())
          .map(([month, stageData]) => {
            const monthEntry: MonthlyDealData = {
              month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            };
            
            stages.forEach(stage => {
              const data = stageData[stage];
              monthEntry[stage] = data ? data.totalValue / data.count : 0;
            });
            
            return monthEntry;
          })
          .sort((a, b) => new Date(a.month + ' 01').getTime() - new Date(b.month + ' 01').getTime());

        setData(chartData);
      } catch (error) {
        console.error('Error fetching deal size chart data:', error);
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

  const chartConfig = dealStages.reduce((config, stage, index) => {
    config[stage] = {
      label: stage,
      color: DEAL_STAGE_COLORS[index % DEAL_STAGE_COLORS.length],
    };
    return config;
  }, {} as any);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Average Deal Size by Stage
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
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    {dealStages.map((stage, index) => (
                      <linearGradient key={stage} id={`gradient-${stage}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={DEAL_STAGE_COLORS[index % DEAL_STAGE_COLORS.length]} stopOpacity={0.6}/>
                        <stop offset="95%" stopColor={DEAL_STAGE_COLORS[index % DEAL_STAGE_COLORS.length]} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
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
                        formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      />
                    }
                  />
                  <Legend />
                  {dealStages.map((stage, index) => (
                    <Area 
                      key={stage}
                      type="monotone" 
                      dataKey={stage} 
                      stroke={DEAL_STAGE_COLORS[index % DEAL_STAGE_COLORS.length]}
                      strokeWidth={2}
                      fill={`url(#gradient-${stage})`}
                      fillOpacity={0.4}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};