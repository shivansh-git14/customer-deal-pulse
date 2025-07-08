
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
}

export interface CriticalAlert {
  deal_id: number;
  customer_name: string;
  sales_rep_name: string;
  deal_stage: string;
  revenueAtRisk: number;
  deal_type: 'New Deal' | 'Repeat Deal';
  sales_manager?: string; // Optional for expanded card UI
}

export interface DashboardData {
  overallRevenue: {
    total: number;
    target: number;
    completionPercentage: number;
  };
  bestPerformer: {
    sales_rep_id: number;
    sales_rep_name: string;
    revenue: number;
    target: number;
    percentTarget: number;
  } | null;
  avgDealSize: number;
  avgActivitiesPerRep: number;
  criticalAlerts: CriticalAlert[];
  availableManagers: Array<{
    sales_rep_id: number;
    sales_rep_name: string;
  }>;
}

export const useDashboardData = (filters: DashboardFilters) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard data with filters:', filters);

        const { data: result, error: functionError } = await supabase.functions.invoke(
          'dashboard-overview',
          {
            body: { filters }
          }
        );

        console.log('Function response:', { result, functionError });

        if (functionError) {
          console.error('Function error details:', functionError);
          throw new Error(`Function error: ${functionError.message}`);
        }

        if (!result) {
          throw new Error('No data returned from function');
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        console.log('Dashboard data loaded successfully:', result.data);
        setData(result.data);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [filters]);

  return { data, loading, error };
};
