import React from 'react';
import { useTopCustomers } from '@/hooks/useTopCustomers';
import type { TopCustomersFilters } from '@/hooks/useTopCustomers';

interface ColumnConfig {
  key: 'rank' | 'customer_name' | 'revenue' | string; // string for future metrics keys
  label: string;
  source?: 'base' | 'metrics'; // default base; metrics for values under row.metrics
  align?: 'left' | 'right' | 'center';
  format?: 'currency' | 'number' | 'text';
}

interface TopCustomersTableProps {
  filters: TopCustomersFilters;
  columns?: ColumnConfig[]; // optional column override for extensibility
}

const defaultColumns: ColumnConfig[] = [
  { key: 'rank', label: 'Rank', align: 'left', format: 'number' },
  { key: 'customer_name', label: 'Customer Name', align: 'left', format: 'text' },
  { key: 'revenue', label: 'Revenue', align: 'right', format: 'currency' },
];

const formatCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Number(value || 0).toLocaleString()}`;
};

export function TopCustomersTable({ filters, columns = defaultColumns }: TopCustomersTableProps) {
  const { data, loading, error } = useTopCustomers({ ...filters, limit: 10, offset: 0 });

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold mb-3">Top Customers</div>

      {loading && (
        <div className="py-8 text-center text-gray-600">Loading top customers…</div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && data && data.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-600 border-b">
                {columns.map((col) => {
                  const align = col.align || 'left';
                  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
                  return (
                    <th key={col.key} className={`py-2 px-3 ${alignClass}`}>{col.label}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.customer_id}-${row.rank}`} className="border-b hover:bg-gray-50">
                  {columns.map((col) => {
                    let value: any = null;
                    if (col.source === 'metrics') {
                      value = (row.metrics || {})[col.key];
                    } else {
                      value = (row as any)[col.key];
                    }

                    if (col.format === 'currency') value = formatCurrency(Number(value || 0));
                    else if (col.format === 'number') value = Number(value ?? 0).toLocaleString();
                    else value = value ?? '-';

                    const align = col.align || 'left';
                    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
                    return (
                      <td key={col.key} className={`py-2 px-3 ${alignClass}`}>{value}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && data && data.rows.length === 0 && (
        <div className="py-8 text-center text-gray-500">No customers found for the selected filters.</div>
      )}
    </div>
  );
}
