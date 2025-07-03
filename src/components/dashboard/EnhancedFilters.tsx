import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Users, Filter, RotateCcw } from 'lucide-react';
import { DateRangeSlider } from './DateRangeSlider';
import { DashboardFilters as FiltersType } from '@/hooks/useDashboardData';

interface EnhancedFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  availableManagers: Array<{
    sales_rep_id: number;
    sales_rep_name: string;
  }>;
}

const TIME_PRESETS = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last Quarter', days: 90 },
  { label: 'Year to Date', days: 365 },
  { label: 'Custom', days: null }
];

export const EnhancedFilters = ({ filters, onFiltersChange, availableManagers }: EnhancedFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetToDefaults = () => {
    onFiltersChange({
      startDate: '2023-01-01',
      endDate: '2025-12-31'
    });
  };

  const applyTimePreset = (days: number | null) => {
    if (days === null) return; // Custom - do nothing
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Dashboard Filters
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Time Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Time Periods</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TIME_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyTimePreset(preset.days)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Range Slider */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            Custom Time Range
          </Label>
          <div className="px-3">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {filters.startDate ? new Date(filters.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Start'}
                </span>
                <span>
                  {filters.endDate ? new Date(filters.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'End'}
                </span>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Use quick presets above or contact support for custom date selection
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-primary" />
                Sales Manager
              </Label>
              <Select
                value={filters.salesManagerId?.toString() || 'all'}
                onValueChange={(value) => 
                  onFiltersChange({
                    ...filters,
                    salesManagerId: value === 'all' ? undefined : parseInt(value)
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {availableManagers.map((manager) => (
                    <SelectItem key={manager.sales_rep_id} value={manager.sales_rep_id.toString()}>
                      {manager.sales_rep_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};