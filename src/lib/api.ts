import { supabase } from '@/integrations/supabase/client';
import type { DashboardFilters } from '@/hooks/useDashboardData';

/**
 * Fetches team metrics from the Supabase edge function.
 * @param filters - The dashboard filters for start date, end date, and sales manager ID.
 * @returns A promise that resolves to the team metrics data.
 */
export const getTeamMetrics = async (filters: DashboardFilters) => {
  const { data, error } = await supabase.functions.invoke('team-metrics', {
    body: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      salesManagerId: filters.salesManagerId,
    },
  });

  if (error) {
    console.error('Error fetching team metrics:', error);
    throw new Error('Failed to fetch team metrics');
  }

  if (!data.success) {
    console.error('API returned an error:', data.error);
    throw new Error(data.error || 'An unknown error occurred');
  }

  return data.data;
};
