import { createContext, useContext, useState, ReactNode } from 'react';
import { useDashboardData, DashboardData, DashboardFilters } from '@/hooks/useDashboardData';

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  availableManagers: Array<{ sales_rep_id: number; sales_rep_name: string; }>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '2023-01-01',
    endDate: '2025-12-31',
  });

  const { data, loading, error } = useDashboardData(filters);

  const value = {
    filters,
    setFilters,
    data,
    loading,
    error,
    availableManagers: data?.availableManagers || [],
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
