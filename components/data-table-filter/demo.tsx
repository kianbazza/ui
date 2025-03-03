'use client'

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableFilter } from '@/registry/data-table-filter/components/data-table-filter'
import { fuzzyFilter } from '@/registry/data-table-filter/lib/filters'
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
import { issues, users } from './data'
import { type Issue, issueStatuses } from './types'

export const columns: ColumnDef<Issue>[] = [
  {
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
  },
  {
    accessorKey: 'status',
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
    meta: {
      displayName: 'Status',
      type: 'option',
      icon: CircleDotDashedIcon,
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <div>{row.getValue('title')}</div>,
    meta: {
      displayName: 'Title',
      type: 'text',
      icon: Heading1Icon,
    },
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => {
      const assigneeId = row.getValue('assignee')
      const user = users.find((x) => x.id === assigneeId)

      if (!assigneeId || !user) {
        return <CircleDashedIcon className="size-5 text-border" />
      }

      const initials = user.name
        .split(' ')
        .map((x) => x[0])
        .join('')
        .toUpperCase()

      return (
        <Avatar className="size-5">
          <AvatarImage src={user.picture} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )
    },
    meta: {
      displayName: 'Assignee',
      type: 'option',
      icon: UserCheckIcon,
    },
  },
  {
    accessorKey: 'estimatedHours',
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
    },
  },
  {
    accessorKey: 'startDate',
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
  },
  {
    accessorKey: 'endDate',
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
  },
]

export default function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data: issues,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          type="search"
          placeholder="Filter issues..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DataTableFilter table={table} />
      </div>
      <div className="rounded-md border">
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
