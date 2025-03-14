import type { ColumnDef } from '@tanstack/react-table'
import type { Issue } from '../types'
import { Checkbox } from '@/components/ui/checkbox'
import { USERS, ISSUE_STATUSES, ISSUE_LABELS } from '../data'
import { filterFn } from '@/lib/filters'
import {
  CalendarArrowDownIcon,
  CalendarArrowUpIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  ClockIcon,
  Heading1Icon,
  TagsIcon,
  UserCheckIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'

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
    accessorKey: 'statusId',
    header: 'Status',
    cell: ({ row }) => {
      const status = ISSUE_STATUSES.find(
        (x) => x.id === row.getValue('statusId'),
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
      options: ISSUE_STATUSES.map((x) => ({
        ...x,
        value: x.id,
        label: x.name,
      })),
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
    filterFn: filterFn('text'),
  },
  {
    accessorKey: 'assigneeId',
    header: 'Assignee',
    cell: ({ row }) => {
      const user = USERS.find((x) => x.id === row.getValue('assigneeId'))

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
    filterFn: filterFn('option'),
    meta: {
      displayName: 'Assignee',
      type: 'option',
      icon: UserCheckIcon,
      // transformFn: (u: User) => u.id,
      options: USERS.map((x) => ({
        value: x.id,
        label: x.name,
        icon: (
          <Avatar className="size-4">
            <AvatarImage src={x.picture} />
            <AvatarFallback>
              {x.name
                .split(' ')
                .map((x) => x[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      })),
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
      max: 16,
    },
    filterFn: filterFn('number'),
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
    filterFn: filterFn('date'),
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
    filterFn: filterFn('date'),
  },
  {
    accessorKey: 'labelIds',
    header: 'Labels',
    cell: ({ row }) => {
      const labelIds = row.getValue<Issue['labelIds']>('labelIds')

      if (!labelIds) {
        return null
      }

      const labels = labelIds.map(
        (labelId) => ISSUE_LABELS.find((x) => x.id === labelId)!,
      )

      return (
        <div className="flex gap-1">
          {labels.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-1 py-1 px-2 rounded-full text-[11px] tracking-[-0.01em]"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </div>
          ))}
        </div>
      )
    },
    filterFn: filterFn('multiOption'),
    meta: {
      displayName: 'Labels',
      type: 'multiOption',
      icon: TagsIcon,
      options: ISSUE_LABELS.map((x) => ({ ...x, value: x.id, label: x.name })),
      // @ts-expect-error: x
      transformFn: (value) => {
        return value ?? []
      },
    },
  },
]
