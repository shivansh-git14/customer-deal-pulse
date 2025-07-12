import React, { useState } from 'react';
import { useLeaderboardData, LeaderboardEntry } from '@/hooks/useLeaderboardData';
import { DashboardFilters } from '@/hooks/useDashboardData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardProps {
  filters: DashboardFilters;
}

type SortKey = keyof LeaderboardEntry;

interface ExpandedRowState {
  [key: string]: boolean;
}

export const Leaderboard = ({ filters }: LeaderboardProps) => {
  const { data, loading, error } = useLeaderboardData(filters);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'performance', direction: 'descending' });
  const [expandedRows, setExpandedRows] = useState<ExpandedRowState>({});

  const sortedData = data ? [...data].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  }) : [];

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const toggleExpandedRow = (id: number) => {
    const strId = id.toString();
    setExpandedRows((prevExpandedRows) => {
      const newExpandedRows = { ...prevExpandedRows };
      Object.keys(newExpandedRows).forEach((key) => {
        newExpandedRows[key] = false;
      });
      newExpandedRows[strId] = !prevExpandedRows[strId];
      return newExpandedRows;
    });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Leaderboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns: { key: SortKey; label: string; className?: string, render?: (value: any) => React.ReactNode }[] = [
    { key: 'sales_rep_name', label: 'Sales Rep', className: 'font-medium' },
    { key: 'performance', label: 'Performance', render: (v) => typeof v === 'number' ? v.toFixed(2) : v },
    { key: 'revenue', label: 'Revenue', render: formatCurrency },
    { key: 'target_percentage', label: 'Target %', render: formatPercentage },
    { key: 'conversion_rate', label: 'Conv. Rate', render: formatPercentage },
    { key: 'avg_deal_size', label: 'Avg. Deal Size', render: formatCurrency },
    { key: 'total_deals', label: 'Total Deals' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Rank</TableHead>
              {columns.map(col => (
                <TableHead key={col.key}>
                  <Button variant="ghost" onClick={() => requestSort(col.key)}>
                    {col.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  {columns.map(col => <TableCell key={col.key}><Skeleton className="h-6 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : sortedData.length > 0 ? (
              sortedData.map((rep, index) => (
                <React.Fragment key={rep.sales_rep_id}>
                  <TableRow onClick={() => toggleExpandedRow(rep.sales_rep_id)} className={index === 0 ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''}>
                    <TableCell className="text-center font-bold text-lg">
                      {index === 0 ? <Crown className="h-6 w-6 text-yellow-500 mx-auto" /> : index + 1}
                    </TableCell>
                    {columns.map(col => (
                      <TableCell key={col.key} className={col.className}>
                        {col.render ? col.render(rep[col.key]) : rep[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows[rep.sales_rep_id.toString()] && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1}>
                        <Card className="mt-4">
                          <CardContent>
                            <p>Insights will appear in future</p>
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center h-24">
                  No leaderboard data available for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
