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
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
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
  TagIcon,
  UserCheckIcon,
} from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { issues } from './data'
import {
  type Issue,
  type IssueLabel,
  type User,
  issueLabels,
  issueStatuses,
} from './types'

export const labelStylesBg: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  neutral: 'bg-neutral-500',
}

export const labelStyles: Record<string, string> = {
  red: 'bg-red-100 border-red-200 text-red-800 dark:bg-red-800 dark:border-red-700 dark:text-red-100',
  orange:
    'bg-orange-100 border-orange-200 text-orange-800 dark:bg-orange-800 dark:border-orange-700 dark:text-orange-100',
  amber:
    'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-800 dark:border-amber-700 dark:text-amber-100',
  yellow:
    'bg-yellow-100 border-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:border-yellow-700 dark:text-yellow-100',
  lime: 'bg-lime-100 border-lime-200 text-lime-800 dark:bg-lime-800 dark:border-lime-700 dark:text-lime-100',
  green:
    'bg-green-100 border-green-200 text-green-800 dark:bg-green-800 dark:border-green-700 dark:text-green-100',
  emerald:
    'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:border-emerald-700 dark:text-emerald-100',
  teal: 'bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-800 dark:border-teal-700 dark:text-teal-100',
  cyan: 'bg-cyan-100 border-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:border-cyan-700 dark:text-cyan-100',
  sky: 'bg-sky-100 border-sky-200 text-sky-800 dark:bg-sky-800 dark:border-sky-700 dark:text-sky-100',
  blue: 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-800 dark:border-blue-700 dark:text-blue-100',
  indigo:
    'bg-indigo-100 border-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:border-indigo-700 dark:text-indigo-100',
  violet:
    'bg-violet-100 border-violet-200 text-violet-800 dark:bg-violet-800 dark:border-violet-700 dark:text-violet-100',
  purple:
    'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-800 dark:border-purple-700 dark:text-purple-100',
  fuchsia:
    'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-800 dark:border-fuchsia-700 dark:text-fuchsia-100',
  pink: 'bg-pink-100 border-pink-200 text-pink-800 dark:bg-pink-800 dark:border-pink-700 dark:text-pink-100',
  rose: 'bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-800 dark:border-rose-700 dark:text-rose-100',
  neutral:
    'bg-neutral-100 border-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100',
}

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
    meta: defineMeta((row) => row.assignee, {
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
  columnHelper.accessor((row) => row.assignee?.name, {
    id: 'assigneeName',
    header: 'Assignee (Name)',
    filterFn: filterFn('option'),
    meta: defineMeta((row) => row.assignee?.name, {
      displayName: 'Assignee name',
      type: 'option',
      icon: UserCheckIcon,
      transformOptionFn: (name) => ({
        value: name,
        label: name,
      }),
    }),
  }),
  columnHelper.accessor('labelIds', {
    id: 'labels',
    header: 'Labels',
    filterFn: filterFn('multiOption'),
    cell: ({ row }) => {
      const labelIds = row.getValue<string[]>('labels')

      if (!labelIds) {
        return null
      }

      const labels = labelIds
        .map((labelId) => issueLabels.find((l) => l.value === labelId))
        .filter((l): l is IssueLabel => !!l)

      return (
        <div className="flex gap-x-2 items-center">
          {labels.map((label) => (
            <Badge key={label.value} className={cn(labelStyles[label.color])}>
              {label.name}
            </Badge>
          ))}
        </div>
      )
    },
    meta: defineMeta((row) => row.labelIds, {
      displayName: 'Labels',
      type: 'multiOption',
      icon: TagIcon,
      options: issueLabels.map((x) => ({
        ...x,
        label: x.name,
        icon: (
          <div className={cn('size-2 rounded-full', labelStylesBg[x.color])} />
        ),
      })),
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
