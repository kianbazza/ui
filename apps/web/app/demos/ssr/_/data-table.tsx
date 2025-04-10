'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  DataTableFilter,
  useDataTableFilters,
} from '@/registry/data-table-filter-v2/components/data-table-filter'
import {
  createColumnConfigHelper,
  createColumns,
} from '@/registry/data-table-filter-v2/lib/filters'
import {
  createTSTColumns,
  createTSTFilters,
} from '@/registry/data-table-filter-v2/lib/filters-tst'
import type {
  Column,
  DataTableFilterActions,
  FiltersState,
} from '@/registry/data-table-filter-v2/lib/filters.types'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useQuery } from '@tanstack/react-query'
import {
  type ColumnDef,
  type Table as TanStackTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  CalendarArrowUpIcon,
  CircleDotDashedIcon,
  ClockIcon,
  Heading1Icon,
  TagsIcon,
  UserCheckIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { columnsConfig } from './column-filters'
import { LABEL_STYLES_MAP, type TW_COLOR, tstColumnDefs } from './columns'
import { fetchIssues, fetchLabels, fetchStatuses, fetchUsers } from './fetch'
import type { Issue } from './types'

interface DataTableProps<TData> {
  table: TanStackTable<TData>
  filters: FiltersState
  columns: Column<TData>[]
  actions: DataTableFilterActions
}

export function DataTable() {
  const labels = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  })

  const statuses = useQuery({
    queryKey: ['statuses'],
    queryFn: fetchStatuses,
  })

  const users = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const issues = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues,
  })

  const { columns, filters, actions } = useDataTableFilters(
    issues.data ?? [],
    createColumns(issues.data ?? [], columnsConfig),
  )

  const [rowSelection, setRowSelection] = useState({})
  const [columnFiltersExternal, setColumnFiltersExternal] =
    useState<FiltersState>([])

  const tstFilters = useMemo(
    () => createTSTFilters(columnFiltersExternal),
    [columnFiltersExternal],
  )

  const tstColumns = useMemo(() => {
    console.log('[DataTableDemo] Creating TST columns')
    return createTSTColumns({
      columns: tstColumnDefs as ColumnDef<Issue>[],
      configs: columnsConfig,
    })
  }, [])

  const table = useReactTable({
    data: issues.data ?? [],
    columns: tstColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters: tstFilters,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center pb-4 gap-2">
        <DataTableFilter
          filters={filters}
          columns={columns}
          actions={actions}
        />
      </div>
      <div className="rounded-md border bg-white dark:bg-inherit">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="h-12"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground tabular-nums">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.{' '}
          <span className="text-primary font-medium">
            Total row count: {table.getCoreRowModel().rows.length}
          </span>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
