import React, { useState } from 'react';
import { useCustomerLifecycleChart } from '@/hooks/useCustomerLifecycleChart';
import type { CustomerLifecycleFilters, LifecycleStage } from '@/hooks/useCustomerLifecycleChart';

interface CustomerLifecycleChartProps {
  filters: CustomerLifecycleFilters;
}

interface TooltipData {
  stage: LifecycleStage;
  month: string;
  x: number;
  y: number;
}

export function CustomerLifecycleChart({ filters }: CustomerLifecycleChartProps) {
  const { data, loading, error } = useCustomerLifecycleChart(filters);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // console.debug('Customer Lifecycle Chart:', { filters, data, loading, error });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Consistent stage ordering across months
  const STAGE_ORDER = ['Acquisition', 'Newly Acquired', 'Loyal', 'At Risk'];
  const orderIndex = (stageName: string) => {
    const idx = STAGE_ORDER.indexOf(stageName);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  // Vibrant modern color palette (accessible contrast)
  const getStageColor = (stage: string) => {
    const stageColors: { [key: string]: string } = {
      'Acquisition': '#2563EB',     // Blue-600
      'Newly Acquired': '#8B5CF6',  // Violet-600
      'Loyal': '#10B981',           // Emerald-500
      'At Risk': '#EF4444',         // Red-500
    };
    return stageColors[stage] || '#A3A3A3';
  };

  // Calculate max customer count for consistent scaling (reserved if needed later)
  const maxCustomers = data?.chartData 
    ? Math.max(...data.chartData.flatMap(month => month.stages.map(stage => stage.customerCount))) 
    : 0;

  // Responsive sizing based on number of months
  const monthsCount = data?.chartData?.length ?? 0;
  const chartHeight = 260;
  const barWidth = monthsCount > 18 ? 22 : monthsCount > 14 ? 28 : monthsCount > 10 ? 34 : monthsCount > 6 ? 42 : 56;
  const barSpacing = monthsCount > 18 ? 8 : monthsCount > 14 ? 10 : monthsCount > 10 ? 12 : monthsCount > 6 ? 14 : 16;
  const plotWidth = monthsCount * (barWidth + barSpacing);
  const yTicks = [0, 25, 50, 75, 100];
  const xTickStep = Math.max(1, Math.ceil(monthsCount / 6));

  const handleMouseEnter = (stage: LifecycleStage, month: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      stage,
      month,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Lifecycle Composition</h3>
        <p className="text-sm text-gray-600">Monthly breakdown of customer lifecycle stages with revenue per segment</p>
      </div>
      
      {loading && (
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderBottomColor: '#274a78' }}></div>
            <div className="text-gray-600">Loading lifecycle data...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium mb-1">Error Loading Data</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}
      
      {!loading && !error && data && data.chartData.length > 0 && (
        <div className="space-y-8">
          {/* Stacked Bar Chart with Axes */}
          <div className="relative">
            <div className="overflow-x-auto">
              <div className="py-2">
                <div className="flex items-start gap-3">
                  {/* Y Axis */}
                  <div className="shrink-0" style={{ height: `${chartHeight}px` }}>
                    <div className="h-full flex flex-col justify-between text-xs text-gray-500">
                      {yTicks.slice().reverse().map((t) => (
                        <div key={`yt-${t}`} className="leading-none">{t}%</div>
                      ))}
                    </div>
                  </div>
                  {/* Plot Area */}
                  <div className="relative" style={{ minWidth: `${plotWidth}px` }}>
                    <div className="relative" style={{ height: `${chartHeight}px` }}>
                      {/* Gridlines */}
                      <div className="absolute inset-0 pointer-events-none">
                        {yTicks.map((t) => (
                          <div
                            key={`grid-${t}`}
                            className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ bottom: `${t}%` }}
                          />
                        ))}
                      </div>
                      {/* Bars */}
                      <div className="absolute inset-0 flex items-end gap-4" style={{ gap: `${barSpacing}px` }}>
                        {data.chartData.map((monthData, monthIndex) => {
                          return (
                            <div key={`month-${monthIndex}`} className="flex flex-col items-center" style={{ width: `${barWidth}px` }}>
                              <div 
                                className="relative border border-gray-200 rounded w-full"
                                style={{ height: `${chartHeight}px`, backgroundColor: '#f9fafb' }}
                              >
                                {(() => {
                                  const sortedStages = monthData.stages
                                    .slice()
                                    .sort((a, b) => orderIndex(a.stage) - orderIndex(b.stage));
                                  return sortedStages.map((stage, stageIndex) => {
                                      const segmentHeight = (stage.percentage / 100) * chartHeight;
                                      const prevPct = sortedStages
                                        .slice(0, stageIndex)
                                        .reduce((sum, s) => sum + s.percentage, 0);
                                      const bottomOffset = (prevPct / 100) * chartHeight;
                                      const isTop = stageIndex === sortedStages.length - 1;
                                      const isBottom = stageIndex === 0;
                                      return (
                                        <div
                                          key={`${stage.stage}-${stageIndex}`}
                                          className="absolute left-0 w-full"
                                          style={{ 
                                            height: `${segmentHeight}px`,
                                            bottom: `${bottomOffset}px`,
                                            backgroundColor: getStageColor(stage.stage),
                                            borderTopLeftRadius: isTop ? 4 : 0,
                                            borderTopRightRadius: isTop ? 4 : 0,
                                            borderBottomLeftRadius: isBottom ? 4 : 0,
                                            borderBottomRightRadius: isBottom ? 4 : 0
                                          }}
                                          onMouseEnter={(e) => handleMouseEnter(stage, monthData.month, e)}
                                          onMouseLeave={handleMouseLeave}
                                        >
                                        </div>
                                      );
                                    });
                                  })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* X Axis */}
                    <div className="relative mt-3" style={{ minWidth: `${plotWidth}px` }}>
                      <div className="h-px w-full bg-gray-200" />
                      {data.chartData.map((monthData, i) => {
                        if (i % xTickStep !== 0) return null;
                        const left = i * (barWidth + barSpacing) + barWidth / 2;
                        return (
                          <div key={`xt-${i}`} className="absolute -bottom-1 translate-y-full -translate-x-1/2 text-xs text-gray-600" style={{ left: `${left}px` }}>
                            {formatMonth(monthData.month)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend - consistent order */}
          <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-gray-200">
            {(() => {
              const ordered = STAGE_ORDER.filter(s => data.availableStages.includes(s));
              const extras = data.availableStages.filter(s => !STAGE_ORDER.includes(s)).sort();
              return [...ordered, ...extras].map((stage) => (
                <div key={stage} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getStageColor(stage) }}
                  ></div>
                  <span className="text-sm text-gray-700">{stage}</span>
                </div>
              ));
            })()}
          </div>

          {/* Summary Statistics removed per design feedback */}
        </div>
      )}
      
      {!loading && !error && (!data || data.chartData.length === 0) && (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">No lifecycle data available</p>
            <p className="text-sm">Try adjusting your date filters or check if customer data exists in the database</p>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="font-medium">{tooltipData.stage.stage}</div>
          <div className="text-gray-300">
            {formatMonth(tooltipData.month)}
          </div>
          <div className="border-t border-gray-700 mt-1 pt-1">
            <div>Customers: {tooltipData.stage.customerCount}</div>
            <div>Revenue: {formatCurrency(tooltipData.stage.totalRevenue)}</div>
            <div>Percentage: {Math.round(tooltipData.stage.percentage)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
