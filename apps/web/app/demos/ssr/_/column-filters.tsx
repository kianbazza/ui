import { cn } from '@/lib/utils'
import { createColumnConfigHelper } from '@/registry/data-table-filter-v2/lib/filters'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import {
  CalendarArrowUpIcon,
  CircleDotDashedIcon,
  ClockIcon,
  Heading1Icon,
  TagsIcon,
  UserCheckIcon,
} from 'lucide-react'
import { LABEL_STYLES_MAP, type TW_COLOR } from './columns'
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
    .accessor((row) => row.status)
    .id('status')
    .displayName('Status')
    .icon(CircleDotDashedIcon)
    .transformOptionFn((v) => ({ value: v.id, label: v.name, icon: v.icon }))
    .build(),
  dtf
    .option()
    .accessor((row) => row.assignee)
    .id('assignee')
    .displayName('Assignee')
    .icon(UserCheckIcon)
    .transformOptionFn((v) => ({
      value: v.id,
      label: v.name,
      icon: (
        <Avatar className="size-4">
          <AvatarImage src={v.picture} />
          <AvatarFallback>
            {v.name
              .split(' ')
              .map((x) => x[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    }))
    .build(),
  dtf
    .multiOption()
    .accessor((row) => row.labels)
    .id('labels')
    .displayName('Labels')
    .icon(TagsIcon)
    .transformOptionFn((data) => ({
      value: data.id,
      label: data.name,
      icon: (
        <div
          className={cn(
            'size-2.5 border-none rounded-full',
            LABEL_STYLES_MAP[data.color as TW_COLOR],
          )}
        />
      ),
    }))
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
