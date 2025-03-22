import { createColumnHelper } from '@tanstack/react-table'
import type { Issue, IssueStatus } from './types'
import { defineMeta, filterFn } from '@/lib/filters'
import {
  CircleDashedIcon,
  CircleDotIcon,
  CircleDotDashedIcon,
  type LucideIcon,
  CircleCheckIcon,
  Heading1Icon,
  CalendarIcon,
  ClockIcon,
} from 'lucide-react'

const columnHelper = createColumnHelper<Issue>()

const ISSUE_STATUSES: Array<{
  value: IssueStatus
  label: string
  icon: LucideIcon
}> = [
    { value: 'backlog', label: 'Backlog', icon: CircleDashedIcon },
    { value: 'todo', label: 'Todo', icon: CircleDotIcon },
    { value: 'in-progress', label: 'In Progress', icon: CircleDotDashedIcon },
    { value: 'done', label: 'Done', icon: CircleCheckIcon },
  ]

export const columns = [
  columnHelper.accessor('title', {
    id: 'title',
    header: 'Title',
    filterFn: filterFn('text'),
    meta: defineMeta('title', {
      displayName: 'Title',
      type: 'text',
      icon: Heading1Icon,
    }),
  }),
  columnHelper.accessor('dueDate', {
    id: 'dueDate',
    header: 'Due Date',
    filterFn: filterFn('date'),
    meta: defineMeta('dueDate', {
      displayName: 'Due Date',
      type: 'date',
      icon: CalendarIcon,
    }),
  }),
  columnHelper.accessor('estimatedHours', {
    id: 'estimatedHours',
    header: 'Estimated Hours',
    filterFn: filterFn('number'),
    meta: defineMeta('estimatedHours', {
      displayName: 'Estimated Hours',
      type: 'number',
      icon: ClockIcon,
    }),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    filterFn: filterFn('option'),
    meta: defineMeta('status', {
      displayName: 'Status',
      type: 'option',
      icon: CircleDotDashedIcon,
      options: ISSUE_STATUSES,
    }),
  }),
]
