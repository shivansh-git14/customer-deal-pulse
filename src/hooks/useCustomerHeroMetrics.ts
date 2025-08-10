import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from '@/hooks/useDashboardData';

export interface CustomerHeroMetrics {
  atRiskRate: number;
  atRiskCustomers: number;
  totalCustomers: number;
  customersWithDmRate: number;
  customersWithDm: number;
  healthEngagementScore: number;
  repeatRevenueRate: number;
  repeatRevenueAmount: number;
  totalRevenueAmount: number;
}

const fetchCustomerHeroMetrics = async (filters: DashboardFilters): Promise<CustomerHeroMetrics> => {
  console.log('🎯 useCustomerHeroMetrics: Fetching customer hero metrics with filters:', filters);
  
  const { data, error } = await supabase.functions.invoke('customer-hero-metrics', {
    body: { filters }
  });

  if (error) {
    console.error('❌ useCustomerHeroMetrics: Error fetching customer hero metrics:', error);
    throw new Error(`Failed to fetch customer hero metrics: ${error.message}`);
  }

  console.log('✅ useCustomerHeroMetrics: Successfully fetched customer hero metrics:', data);
  
  // PostgreSQL function now returns real calculation values
  return {
    atRiskRate: data.atRiskRate || 0,
    atRiskCustomers: data.atRiskCustomers || 0,
    totalCustomers: data.totalCustomers || 0,
    customersWithDmRate: data.customersWithDmRate || 0,
    customersWithDm: data.customersWithDm || 0,
    healthEngagementScore: data.healthEngagementScore || 0,
    repeatRevenueRate: data.repeatRevenueRate || 0,
    repeatRevenueAmount: data.repeatRevenueAmount || 0,
    totalRevenueAmount: data.totalRevenueAmount || 0
  };
};

export const useCustomerHeroMetrics = (filters: DashboardFilters) => {
  return useQuery({
    queryKey: ['customer-hero-metrics', filters],
    queryFn: () => fetchCustomerHeroMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
};
