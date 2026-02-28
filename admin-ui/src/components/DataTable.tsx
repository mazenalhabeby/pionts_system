import { memo } from 'react';
import type { ColumnDef } from '../constants';

interface DataTableProps {
  columns: ColumnDef[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDir?: string;
}

export default memo(function DataTable({ columns, data, onRowClick, onSort, sortKey, sortDir }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div className="text-center p-5 text-text-muted">No data to display.</div>;
  }

  function handleHeaderClick(col: ColumnDef) {
    if (col.sortable && onSort) {
      onSort(col.key);
    }
  }

  function renderSortArrow(col: ColumnDef) {
    if (!col.sortable || sortKey !== col.key) return null;
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  return (
    <table className="w-full border-collapse rounded-lg overflow-hidden">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`text-left px-3 py-2.5 text-[13px] text-text-muted border-b border-border-default ${col.sortable ? 'cursor-pointer hover:text-text-primary' : ''}`}
              onClick={() => handleHeaderClick(col)}
            >
              {col.label}
              {renderSortArrow(col)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={row.id || idx}
            className={`${onRowClick ? 'cursor-pointer' : ''} hover:[&_td]:bg-bg-surface-hover`}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-2.5 border-b border-border-subtle text-sm text-text-secondary">{row[col.key] != null ? row[col.key] : '--'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});
