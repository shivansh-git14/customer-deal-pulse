import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWaterfallData } from '@/hooks/useNewDealsData';

export function NewDealsWaterfall({ filters }: { filters: any }) {
  const { waterfallData, loading, error } = useWaterfallData(filters);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">Waterfall</h3>
      <p className="text-sm text-gray-600 mb-4">Stage-to-Stage Conversion Rates Pipeline Velocity</p>
      
      {loading && (
        <div className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      )}
      
      {error && <div className="text-red-600">Error: {error}</div>}
      
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
