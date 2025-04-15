import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { CircleDashedIcon } from 'lucide-react'
import type { Issue } from './types'

export const LABEL_STYLES_MAP = {
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
} as const

export const LABEL_STYLES_BG = {
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
                'flex items-center gap-1 py-1 px-2 rounded-md text-[12px] shadow-xs text-white font-medium border',
                LABEL_STYLES_MAP[l.color as TW_COLOR],
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
