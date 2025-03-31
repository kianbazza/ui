'use client'

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableFilter } from '@/registry/data-table-filter/components/data-table-filter'
import { defineMeta, filterFn } from '@/registry/data-table-filter/lib/filters'
import { format } from 'date-fns'
import {
  CalendarArrowDownIcon,
  CalendarArrowUpIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  ClockIcon,
  Heading1Icon,
  UserCheckIcon,
} from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { issues } from './data'
import { type Issue, type User, issueStatuses } from './types'

const columnHelper = createColumnHelper<Issue>()

export const columns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = issueStatuses.find(
        (x) => x.value === row.getValue('status'),
      )!

      const StatusIcon = status.icon

      return (
        <div className="flex items-center gap-2">
          <StatusIcon className="size-4" />
          <span>{status.name}</span>
        </div>
      )
    },
    filterFn: filterFn('option'),
    meta: {
      displayName: 'Status',
      type: 'option',
      icon: CircleDotDashedIcon,
      options: issueStatuses.map((x) => ({ ...x, label: x.name })),
    },
  }),
  columnHelper.accessor('title', {
    id: 'title',
    header: 'Title',
    cell: ({ row }) => <div>{row.getValue('title')}</div>,
    meta: {
      displayName: 'Title',
      type: 'text',
      icon: Heading1Icon,
    },
    filterFn: filterFn('text'),
  }),
  columnHelper.accessor('assignee', {
    id: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => {
      const assignee = row.getValue<User | undefined>('assignee')
      if (!assignee) {
        return <CircleDashedIcon className="size-5 text-border" />
      }

      const initials = assignee.name
        .split(' ')
        .map((x) => x[0])
        .join('')
        .toUpperCase()

      return (
        <Avatar className="size-5">
          <AvatarImage src={assignee.picture} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )
    },
    filterFn: filterFn('option'),
    meta: defineMeta('assignee', {
      displayName: 'Assignee',
      type: 'option',
      icon: UserCheckIcon,
      transformOptionFn: (u) => ({
        value: u.id,
        label: u.name,
        icon: (
          <Avatar key={u.id} className="size-4">
            <AvatarImage src={u.picture} />
            <AvatarFallback>
              {u.name
                .split(' ')
                .map((x) => x[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      }),
    }),
  }),
  columnHelper.accessor('estimatedHours', {
    id: 'estimatedHours',
    header: 'Estimated Hours',
    cell: ({ row }) => {
      const estimatedHours = row.getValue<number>('estimatedHours')

      if (!estimatedHours) {
        return null
      }

      return (
        <span>
          <span className="tabular-nums tracking-tighter">
            {estimatedHours}
          </span>
          <span className="text-muted-foreground ml-0.5">h</span>
        </span>
      )
    },
    meta: {
      displayName: 'Estimated Hours',
      type: 'number',
      icon: ClockIcon,
      max: 100,
    },
    filterFn: filterFn('number'),
  }),
  columnHelper.accessor('startDate', {
    id: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => {
      const startDate = row.getValue<Issue['startDate']>('startDate')

      if (!startDate) {
        return null
      }

      const formatted = format(startDate, 'MMM dd')

      return <span>{formatted}</span>
    },
    meta: {
      displayName: 'Start Date',
      type: 'date',
      icon: CalendarArrowUpIcon,
    },
    filterFn: filterFn('date'),
  }),
  columnHelper.accessor('endDate', {
    id: 'endDate',
    header: 'End Date',
    cell: ({ row }) => {
      const endDate = row.getValue<Issue['endDate']>('endDate')

      if (!endDate) {
        return null
      }

      const formatted = format(endDate, 'MMM dd')

      return <span>{formatted}</span>
    },
    meta: {
      displayName: 'End Date',
      type: 'date',
      icon: CalendarArrowDownIcon,
    },
    filterFn: filterFn('date'),
  }),
]

const dataTableFilterQuerySchema = z
  .object({
    id: z.string(),
    value: z.object({
      operator: z.string(),
      values: z.any(),
    }),
  })
  .array()
  .min(0)

type DataTableFilterQuerySchema = z.infer<typeof dataTableFilterQuerySchema>

function initializeFiltersFromQuery<TData, TValue>(
  filters: DataTableFilterQuerySchema,
  columns: ColumnDef<TData, TValue>[],
) {
  return filters && filters.length > 0
    ? filters.map((f) => {
        const columnMeta = columns.find((c) => c.id === f.id)!.meta!

        const values =
          columnMeta.type === 'date'
            ? f.value.values.map((v: string) => new Date(v))
            : f.value.values

        return {
          ...f,
          value: {
            operator: f.value.operator,
            values,
            columnMeta,
          },
        }
      })
    : []
}

export default function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [queryFilters, setQueryFilters] = useQueryState(
    'filter',
    parseAsJson(dataTableFilterQuerySchema.parse).withDefault([]),
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    () =>
      initializeFiltersFromQuery(queryFilters, columns as ColumnDef<Issue>[]),
  )
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    setQueryFilters(
      columnFilters.map((f) => ({
        id: f.id,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        value: { ...(f.value as any), columnMeta: undefined },
      })),
    )
  }, [columnFilters, setQueryFilters])

  React.useEffect(() => {
    console.log('queryFilters:', queryFilters)
    console.log('columnFilters:', columnFilters)
  }, [queryFilters, columnFilters])

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <DataTableFilter table={table} />
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
                  colSpan={columns.length}
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
          {table.getFilteredRowModel().rows.length} row(s) selected.
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
