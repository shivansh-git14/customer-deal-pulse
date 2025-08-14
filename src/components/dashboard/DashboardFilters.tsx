import { Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboard } from '@/contexts/DashboardContext';

export const DashboardFilters = () => {
  const { filters, setFilters, availableManagers } = useDashboard();

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilters({
      ...filters,
      [field]: value || undefined
    });
  };

  const handleManagerChange = (value: string) => {
    setFilters({
      ...filters,
      salesManagerId: value === 'all' ? undefined : parseInt(value)
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <Card className="w-full">
      <CardContent className="py-3 sm:py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>

          {/* Sales Manager */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sales Manager
            </Label>
            <Select
              value={filters.salesManagerId?.toString() || 'all'}
              onValueChange={handleManagerChange}
            >
              <SelectTrigger>
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

          {/* Clear Filters Button - inline on md+ */}
          <div className="flex md:justify-end">
            <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto h-10">
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};