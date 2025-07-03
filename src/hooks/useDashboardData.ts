import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
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
    totalDeals: number;
    wonDeals: number;
    conversionRate: number;
  } | null;
  avgDealSize: number;
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

        const { data: result, error: functionError } = await supabase.functions.invoke(
          'dashboard-overview',
          {
            body: { filters }
          }
        );

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

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