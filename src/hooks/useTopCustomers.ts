import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopCustomersFilters {
  startDate?: string;
  endDate?: string;
  salesManagerId?: number;
  limit?: number;
  offset?: number;
  selectFields?: string[]; // reserved for future extensibility
}

export interface TopCustomerRow {
  rank: number;
  customer_id: number;
  customer_name: string;
  revenue: number;
  metrics: Record<string, unknown>;
}

export interface TopCustomersData {
  rows: TopCustomerRow[];
  metadata: {
    limit: number;
    offset: number;
    dateRange: { startDate?: string | null; endDate?: string | null };
    filterApplied: { salesManagerId?: number | null };
  };
}

export const useTopCustomers = (filters: TopCustomersFilters) => {
  const [data, setData] = useState<TopCustomersData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTopCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: fnError } = await supabase.functions.invoke('top-customers', {
          body: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            salesManagerId: filters.salesManagerId,
            limit: filters.limit ?? 10,
            offset: filters.offset ?? 0,
            selectFields: filters.selectFields,
          },
        });

        if (fnError) {
          throw new Error(fnError.message || 'Failed to fetch top customers');
        }
        if (!result || !result.success) {
          throw new Error(result?.error || 'Top customers function returned an error');
        }

        if (isMounted) setData(result.data as TopCustomersData);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTopCustomers();

    return () => {
      isMounted = false;
    };
  }, [filters.startDate, filters.endDate, filters.salesManagerId, filters.limit, filters.offset]);

  return { data, loading, error };
};
