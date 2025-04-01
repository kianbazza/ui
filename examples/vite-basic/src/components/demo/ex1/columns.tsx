import { type ColumnOption, defineMeta, filterFn } from '@/lib/filters'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import {
  CalendarIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  ClockIcon,
  Heading1Icon,
} from 'lucide-react'
import type { Issue, IssueStatus } from './types'

const columnHelper = createColumnHelper<Issue>()

const ISSUE_STATUSES: Array<ColumnOption & { value: IssueStatus }> = [
  { value: 'backlog', label: 'Backlog', icon: CircleDashedIcon },
  { value: 'todo', label: 'Todo', icon: CircleDotIcon },
  { value: 'in-progress', label: 'In Progress', icon: CircleDotDashedIcon },
  { value: 'done', label: 'Done', icon: CircleCheckIcon },
] as const

export const columns: ColumnDef<Issue, any>[] = [
  columnHelper.accessor('title', {
    id: 'title',
    header: 'Title',
    filterFn: filterFn('text'),
    meta: defineMeta((row) => row.title, {
      displayName: 'Title',
      type: 'text',
      icon: Heading1Icon,
    }),
  }),
  columnHelper.accessor('dueDate', {
    id: 'dueDate',
    header: 'Due Date',
    filterFn: filterFn('date'),
    meta: defineMeta((row) => row.dueDate, {
      displayName: 'Due Date',
      type: 'date',
      icon: CalendarIcon,
    }),
  }),
  columnHelper.accessor('estimatedHours', {
    id: 'estimatedHours',
    header: 'Estimated Hours',
    filterFn: filterFn('number'),
    meta: defineMeta((row) => row.estimatedHours, {
      displayName: 'Estimated Hours',
      type: 'number',
      icon: ClockIcon,
    }),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    filterFn: filterFn('option'),
    meta: defineMeta((row) => row.status, {
      displayName: 'Status',
      type: 'option',
      icon: CircleDotDashedIcon,
      options: ISSUE_STATUSES,
    }),
  }),
]
