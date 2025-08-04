import { useNewDealsMetrics } from '@/hooks/useNewDealsData';

interface NewDealsMetricsProps {
  filters: any;
}

export function NewDealsMetrics({ filters }: NewDealsMetricsProps) {
  const { metrics, loading, error } = useNewDealsMetrics(filters);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white p-4 rounded-lg shadow border">
        <h4 className="text-sm font-medium text-gray-500">Lead Response Time</h4>
        <p className="text-xs text-gray-400">(Days from prospecting to qualified)</p>
        <p className="text-2xl font-bold mt-2">{metrics?.leadResponseTime || 0} days</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <h4 className="text-sm font-medium text-gray-500">Lead-to-Opportunity Conversion Rate</h4>
        <p className="text-xs text-gray-400">(Prospecting to closed_won/won)</p>
        <p className="text-2xl font-bold mt-2">{metrics?.conversionRate || 0}%</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <h4 className="text-sm font-medium text-gray-500">Deal Cycle Length</h4>
        <p className="text-xs text-gray-400">(Prospecting to closed_won/won days)</p>
        <p className="text-2xl font-bold mt-2">{metrics?.dealCycleLength || 0} days</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <h4 className="text-sm font-medium text-gray-500">Number of Touchpoints per Deal</h4>
        <p className="text-xs text-gray-400">(# events / # deal_id)</p>
        <p className="text-2xl font-bold mt-2">{metrics?.touchpointsPerDeal || 0}</p>
      </div>
    </div>
  );
}
