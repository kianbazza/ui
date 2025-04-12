import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters'
import {
  CalendarArrowUpIcon,
  CircleDotDashedIcon,
  ClockIcon,
  Heading1Icon,
  TagsIcon,
  UserCheckIcon,
} from 'lucide-react'
import type { Issue } from './types'

const dtf = createColumnConfigHelper<Issue>()

export const columnsConfig = [
  dtf
    .text()
    .id('title')
    .accessor((row) => row.title)
    .displayName('Title')
    .icon(Heading1Icon)
    .build(),
  dtf
    .option()
    .accessor((row) => row.status.id)
    .id('status')
    .displayName('Status')
    .icon(CircleDotDashedIcon)
    .build(),
  dtf
    .option()
    .accessor((row) => row.assignee?.id)
    .id('assignee')
    .displayName('Assignee')
    .icon(UserCheckIcon)
    .build(),
  dtf
    .multiOption()
    .accessor((row) => row.labels?.map((l) => l.id))
    .id('labels')
    .displayName('Labels')
    .icon(TagsIcon)
    .build(),
  dtf
    .number()
    .accessor((row) => row.estimatedHours)
    .id('estimatedHours')
    .displayName('Estimated hours')
    .icon(ClockIcon)
    .min(0)
    .max(100)
    .build(),
  dtf
    .date()
    .accessor((row) => row.startDate)
    .id('startDate')
    .displayName('Start Date')
    .icon(CalendarArrowUpIcon)
    .build(),
] as const
