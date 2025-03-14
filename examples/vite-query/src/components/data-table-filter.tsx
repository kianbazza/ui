import { PropertyFilterList } from '@/components/property-filter-list'
import { TableFilterActions } from '@/components/table-filter-actions'
import { TableFilter } from '@/components/table-filter-menu'
import type { Table } from '@tanstack/react-table'

export function DataTableFilter<TData, TValue>({
  table,
}: { table: Table<TData> }) {
  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex h-full w-full items-stretch gap-2">
        <TableFilter table={table} />
        <PropertyFilterList table={table} />
      </div>
      <TableFilterActions table={table} />
    </div>
  )
}
