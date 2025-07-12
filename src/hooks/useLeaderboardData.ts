import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useDashboardData';

export interface LeaderboardEntry {
  sales_rep_id: number;
  sales_rep_name: string;
  revenue: number;
  target: number;
  target_percentage: number;
  conversion_rate: number;
  total_deals: number;
  avg_deal_size: number;
  performance: number;
}

export const useLeaderboardData = (filters: DashboardFilters) => {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: functionError } = await supabase.functions.invoke(
          'leaderboard-metrics',
          {
            body: { ...filters },
          }
        );

        if (functionError) {
          throw new Error(`Function error: ${functionError.message}`);
        }

        if (!result || !result.success) {
          throw new Error(result.error || 'Failed to fetch leaderboard data');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [filters]);

  return { data, loading, error };
};
