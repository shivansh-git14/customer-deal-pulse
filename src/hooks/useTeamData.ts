import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  sales_rep_id: number;
  sales_rep_name: string;
  sales_rep_manager_id: number | null;
  team_count: number;
}

export interface TeamPerformance {
  manager_id: number;
  manager_name: string;
  team_count: number;
  revenue: number;
  target: number;
  target_percentage: number;
  conversion_rate: number;
  efficiency: number;
  momentum: 'accelerating' | 'improving' | 'stable' | 'declining';
  risk_level: 'low' | 'medium' | 'high';
  performance_score: number;
}

export interface TeamFilters {
  startDate?: string;
  endDate?: string;
}

export interface TeamData {
  teams: TeamPerformance[];
  totalMembers: number;
  totalRevenue: number;
  avgPerformance: number;
}

export const useTeamData = (filters: TeamFilters) => {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: functionError } = await supabase.functions.invoke('team-overview', {
          body: { filters }
        });

        if (functionError) {
          throw functionError;
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to fetch team data');
        }

        setData(result.data);
      } catch (err) {
        console.error('Team data fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [filters]);

  return { data, loading, error };
};