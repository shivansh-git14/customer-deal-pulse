import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Filter } from 'lucide-react';
import { DashboardFilters as FiltersType } from '@/hooks/useDashboardData';

interface DateRangeSliderProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  availableManagers: Array<{
    sales_rep_id: number;
    sales_rep_name: string;
  }>;
}

export const DateRangeSlider = ({ filters, onFiltersChange, availableManagers }: DateRangeSliderProps) => {
  const [dateRange, setDateRange] = useState([0, 100]);
  
  // Define min and max dates for the slider
  const minDate = new Date('2023-01-01');
  const maxDate = new Date('2025-12-31');
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  // Convert slider values to dates
  const convertSliderToDate = (value: number) => {
    const days = Math.floor((value / 100) * totalDays);
    const date = new Date(minDate.getTime() + days * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  // Convert dates to slider values
  const convertDateToSlider = (dateString: string) => {
    const date = new Date(dateString);
    const days = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor((days / totalDays) * 100);
  };

  // Initialize slider values from filters
  useEffect(() => {
    if (filters.startDate || filters.endDate) {
      const startValue = filters.startDate ? convertDateToSlider(filters.startDate) : 0;
      const endValue = filters.endDate ? convertDateToSlider(filters.endDate) : 100;
      setDateRange([startValue, endValue]);
    }
  }, [filters.startDate, filters.endDate]);

  const handleSliderChange = (values: number[]) => {
    setDateRange(values);
    
    const startDate = convertSliderToDate(values[0]);
    const endDate = convertSliderToDate(values[1]);
    
    onFiltersChange({
      ...filters,
      startDate,
      endDate
    });
  };

  const handleManagerChange = (value: string) => {
    onFiltersChange({
      ...filters,
      salesManagerId: value === 'all' ? undefined : parseInt(value)
    });
  };

  const formatDateLabel = (value: number) => {
    const date = new Date(convertSliderToDate(value));
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-primary" />
          Dashboard Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Slider */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            Time Period
          </Label>
          <div className="px-3">
            <Slider
              value={dateRange}
              onValueChange={handleSliderChange}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatDateLabel(dateRange[0])}</span>
              <span>{formatDateLabel(dateRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Sales Manager Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            Sales Manager
          </Label>
          <Select
            value={filters.salesManagerId?.toString() || 'all'}
            onValueChange={handleManagerChange}
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
      </CardContent>
    </Card>
  );
};