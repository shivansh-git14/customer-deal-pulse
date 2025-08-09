import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerLifecycleFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
}

export interface LifecycleStage {
  stage: string;
  customerCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface MonthlyLifecycleData {
  month: string;
  stages: LifecycleStage[];
}

export interface CustomerLifecycleChartData {
  chartData: MonthlyLifecycleData[];
  availableManagers: Array<{
    sales_rep_id: number;
    sales_rep_name: string;
  }>;
  availableStages: string[];
  metadata: {
    totalMonths: number;
    dateRange: {
      startDate?: string;
      endDate?: string;
    };
    filterApplied: {
      salesManagerId?: number;
    };
  };
}

export const useCustomerLifecycleChart = (filters: CustomerLifecycleFilters) => {
  const [data, setData] = useState<CustomerLifecycleChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLifecycleData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching customer lifecycle chart data with filters:', filters);

        const { data: result, error: functionError } = await supabase.functions.invoke(
          'customer-lifecycle-chart',
          {
            body: {
              startDate: filters.startDate,
              endDate: filters.endDate,
              salesManagerId: filters.salesManagerId
            }
          }
        );

        console.log('Customer lifecycle function response:', { result, functionError });

        if (functionError) {
          console.error('Function error details:', functionError);
          throw new Error(`Function error: ${functionError.message}`);
        }

        if (!result) {
          throw new Error('No data returned from customer lifecycle function');
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch customer lifecycle data');
        }

        console.log('Customer lifecycle data loaded successfully:', {
          monthsCount: result.data.chartData?.length || 0,
          stagesCount: result.data.availableStages?.length || 0,
          managersCount: result.data.availableManagers?.length || 0
        });

        setData(result.data);
      } catch (err) {
        console.error('Customer lifecycle data fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLifecycleData();
  }, [filters.startDate, filters.endDate, filters.salesManagerId]);

  return { data, loading, error };
};
