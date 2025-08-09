import { useNewDealsTableData } from '@/hooks/useNewDealsData';

export function LostOpportunitiesTable({ filters }: { filters: any }) {
  const { tableData, loading, error } = useNewDealsTableData(filters);
  
  // Format total value for display with null safety
  const formatTotalValue = (value: number | undefined | null) => {
    const safeValue = value || 0;
    if (safeValue >= 1000000) {
      return `$${(safeValue / 1000000).toFixed(1)}M`;
    } else if (safeValue >= 1000) {
      return `$${(safeValue / 1000).toFixed(0)}K`;
    } else {
      return `$${safeValue.toLocaleString()}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Lost Opportunities</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Lost Opportunities</h3>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">
        Lost Opportunities 
        <span className="text-sm text-red-600 font-normal ml-2">
          ({formatTotalValue(tableData.lostTotalValue)} total)
        </span>
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Event
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.lostOpportunities?.map((deal: any, index: number) => (
              <tr key={`lost-opportunity-${deal.deal_id}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {deal.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${deal.deal_value?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs">
                  {deal.event_summary ? (
                    <span title={deal.event_summary}>
                      {deal.event_summary.length > 50 
                        ? `${deal.event_summary.substring(0, 50)}...` 
                        : deal.event_summary
                      }
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">No recent events</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!tableData.lostOpportunities || tableData.lostOpportunities.length === 0) && (
          <div className="text-center py-8 text-gray-500">No lost opportunities found</div>
        )}
      </div>
    </div>
  );
}
