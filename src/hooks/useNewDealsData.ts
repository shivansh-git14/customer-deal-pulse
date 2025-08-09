import { useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface WaterfallStage {
  stage: string;
  dealCount: number;
  totalValue: number;
  conversionRate?: number;
}

interface DealTableRecord {
  deal_id: number;
  deal_value: number;
  deal_stage: string;
  customer_name: string;
  event_summary?: string;
  event_timestamp?: string;
}

interface TableData {
  topDeals: DealTableRecord[];
  lostOpportunities: DealTableRecord[];
  lostTotalValue: number;
}

export function useNewDealsMetrics(filters: any) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/new-deals-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...filters }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [filters]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

export function useWaterfallData(filters: any) {
  const [waterfallData, setWaterfallData] = useState<WaterfallStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaterfallData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/new-deals-waterfall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },

        body: JSON.stringify({ startDate: filters.startDate, endDate: filters.endDate, salesManagerId: filters.salesManagerId }),

      });

      const result = await response.json();
      
      if (result.success) {
        setWaterfallData(result.data.waterfall || []);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch waterfall data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaterfallData();
  }, [filters]);

  return { waterfallData, loading, error, refetch: fetchWaterfallData };
}

export function useNewDealsTableData(filters: any) {
  const [tableData, setTableData] = useState<TableData>({ topDeals: [], lostOpportunities: [], lostTotalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/new-deals-tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ filters }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTableData(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [filters]);

  return { tableData, loading, error, refetch: fetchTableData };
}
