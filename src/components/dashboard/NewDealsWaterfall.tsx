
import React from 'react';
import { useWaterfallData } from '@/hooks/useNewDealsData';

export function NewDealsWaterfall({ filters }: { filters: any }) {
  const { waterfallData, loading, error } = useWaterfallData(filters);


  // Debug logging
  console.log('🔍 Waterfall Debug:', { filters, waterfallData, loading, error });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Color scheme based on design tenets - Japanese-inspired
  const getStageColor = (index: number) => {
    const colors = [
      '#274a78', // Aizome (Japanese Indigo) - Prospecting
      '#5654a2', // Kikyo (Bellflower Violet) - Qualified  
      '#33a6b8', // Asagi (Pale Blue) - Negotiation
      '#395b50', // Matsuba (Pine Needle Green) - Closed won
    ];
    return colors[index] || '#274a78';
  };

  // Calculate max deal count for scaling bar heights
  const maxDeals = waterfallData ? Math.max(...waterfallData.map(stage => stage.dealCount)) : 0;
  
  const getBarHeight = (dealCount: number) => {
    // Use compact heights for single-glance view
    const minHeight = 60; // Minimum height
    const maxHeight = 180; // Maximum height
    if (maxDeals === 0) return minHeight;
    
    // Ensure proper scaling - each bar should be proportional
    const scaleFactor = dealCount / maxDeals;
    const height = minHeight + (scaleFactor * (maxHeight - minHeight));
    
    return Math.round(height);
  };
    
  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Deals Waterfall</h3>
        <p className="text-sm text-gray-600">Stage-to-Stage Conversion Rates & Pipeline Velocity</p>
      </div>
      
      {loading && (
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-gray-600">Loading waterfall data...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium mb-1">Error Loading Data</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}
      
      {!loading && !error && waterfallData && waterfallData.length > 0 && (
        <div className="space-y-8">
          {/* True Waterfall Chart */}
          <div className="relative w-full">
            {/* Chart Container */}
            <div className="flex items-end justify-center gap-1 sm:gap-2 py-4 w-full" style={{ minHeight: '250px', maxHeight: '300px' }}>
              {waterfallData.map((stage, index) => {
                const barHeight = getBarHeight(stage.dealCount);
                
                return (
                  <div key={`waterfall-stage-${index}`} className="flex items-center">
                    <div className="flex flex-col items-center">
                      {/* Total Deal Value - Above Bar */}
                      <div className="mb-2 text-center">
                        <div className="text-xs text-gray-500 font-medium mb-1">Total deal value</div>
                        <div 
                          className="text-sm font-bold"
                          style={{ color: getStageColor(index) }}
                        >
                          {formatCurrency(stage.totalValue)}
                        </div>
                      </div>
                      
                      {/* Waterfall Bar - Aligned to baseline */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-16 sm:w-20 rounded-t border-2 border-b-0 flex flex-col justify-center relative transition-all duration-300 hover:shadow-lg"
                          style={{ 
                            height: `${barHeight}px`,
                            borderColor: getStageColor(index),
                            backgroundColor: `${getStageColor(index)}15` // 15% opacity
                          }}
                        >
                          {/* Number of Deals - Center of Bar */}
                          <div className="flex flex-col items-center justify-center">
                            <div 
                              className="text-lg sm:text-xl font-bold mb-1"
                              style={{ color: getStageColor(index) }}
                            >
                              {stage.dealCount}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">#deals</div>
                          </div>
                        </div>
                        
                        {/* Stage Label */}
                        <div className="mt-2">
                          <div 
                            className="px-2 py-1 rounded text-white text-xs font-medium text-center"
                            style={{ backgroundColor: getStageColor(index) }}
                          >
                            {stage.stage}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conversion Rate - Between bars */}
                    {index < waterfallData.length - 1 && (
                      <div className="flex flex-col items-center justify-center px-1" style={{ minWidth: '50px' }}>
                        <div className="text-center mb-1">
                          <div 
                            className="text-sm font-bold mb-1"
                            style={{ color: getStageColor(index + 1) }}
                          >
                            {waterfallData[index + 1].conversionRate}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Conversion
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="text-gray-400 text-lg">→</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {waterfallData[0]?.dealCount || 0}
              </div>
              <div className="text-sm text-gray-600">Total Deals Started</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {waterfallData[waterfallData.length - 1]?.dealCount || 0}
              </div>
              <div className="text-sm text-gray-600">Deals Won</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {waterfallData[waterfallData.length - 1]?.conversionRate || 0}%
              </div>
              <div className="text-sm text-gray-600">Overall Conversion</div>
            </div>
          </div>
        </div>
      )}
      

      {!loading && !error && (!waterfallData || waterfallData.length === 0) && (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">No waterfall data available</p>
            <p className="text-sm">Try adjusting your date filters or check if deals exist in the database</p>
          </div>
        </div>
      )}
    </div>
  );
}
