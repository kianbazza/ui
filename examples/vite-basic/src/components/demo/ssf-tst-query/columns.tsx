import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { CircleDashedIcon } from 'lucide-react'
import type { Issue } from './types'

export const LABEL_STYLES_MAP = {
  red: 'bg-red-500 border-red-500',
  orange: 'bg-orange-500 border-orange-500',
  amber: 'bg-amber-500 border-amber-500',
  yellow: 'bg-yellow-500 border-yellow-500',
  lime: 'bg-lime-500 border-lime-500',
  green: 'bg-green-500 border-green-500',
  emerald: 'bg-emerald-500 border-emerald-500',
  teal: 'bg-teal-500 border-teal-500',
  cyan: 'bg-cyan-500 border-cyan-500',
  sky: 'bg-sky-500 border-sky-500',
  blue: 'bg-blue-500 border-blue-500',
  indigo: 'bg-indigo-500 border-indigo-500',
  violet: 'bg-violet-500 border-violet-500',
  purple: 'bg-purple-500 border-purple-500',
  fuchsia: 'bg-fuchsia-500 border-fuchsia-500',
  pink: 'bg-pink-500 border-pink-500',
  rose: 'bg-rose-500 border-rose-500',
  neutral: 'bg-neutral-500 border-neutral-500',
} as const

export type TW_COLOR = keyof typeof LABEL_STYLES_MAP

const columnHelper = createColumnHelper<Issue>()

export const tstColumnDefs = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
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
    enableColumnFilter: false,
  }),
  columnHelper.accessor((row) => row.status.id, {
    id: 'status',
    header: 'Status',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const { status } = row.original
      const StatusIcon = status.icon

      return (
        <div className="flex items-center gap-2">
          <StatusIcon className="size-4" />
          <span>{status.name}</span>
        </div>
      )
    },
  }),
  columnHelper.accessor((row) => row.title, {
    id: 'title',
    header: 'Title',
    enableColumnFilter: true,
    cell: ({ row }) => <div>{row.getValue('title')}</div>,
  }),
  columnHelper.accessor((row) => row.assignee?.id, {
    id: 'assignee',
    header: 'Assignee',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const user = row.original.assignee

      if (!user) {
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
  }),
  columnHelper.accessor((row) => row.estimatedHours, {
    id: 'estimatedHours',
    header: 'Estimated Hours',
    enableColumnFilter: true,
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
  }),
  columnHelper.accessor((row) => row.startDate, {
    id: 'startDate',
    header: 'Start Date',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const startDate = row.getValue<Issue['startDate']>('startDate')

      if (!startDate) {
        return null
      }

      const formatted = format(startDate, 'MMM dd')

      return <span>{formatted}</span>
    },
  }),
  columnHelper.accessor((row) => row.endDate, {
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
  }),
  columnHelper.accessor((row) => row.labels?.map((l) => l.id), {
    id: 'labels',
    header: 'Labels',
    enableColumnFilter: true,
    cell: ({ row }) => {
      const labels = row.original.labels

      if (!labels) return null

      return (
        <div className="flex gap-1">
          {labels.map((l) => (
            <div
              key={l.id}
              className={cn(
                'flex items-center gap-1 py-1 px-2 rounded-full text-[11px] tracking-[-0.01em] shadow-xs',
                LABEL_STYLES_MAP[l.color as TW_COLOR],
                'border-none text-white font-medium',
              )}
            >
              {l.name}
            </div>
          ))}
        </div>
      )
    },
  }),
]
