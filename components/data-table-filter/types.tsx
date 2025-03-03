import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  type LucideIcon,
} from 'lucide-react'

export type User = {
  id: string
  name: string
  picture: string
}

export type Issue = {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in-progress' | 'done'
  assignee?: string
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
}

export type IssueStatus = {
  value: Issue['status']
  name: string
  icon: LucideIcon
}

export const issueStatuses: IssueStatus[] = [
  {
    value: 'backlog',
    name: 'Backlog',
    icon: CircleDashedIcon,
  },
  {
    value: 'todo',
    name: 'Todo',
    icon: CircleIcon,
  },
  {
    value: 'in-progress',
    name: 'In Progress',
    icon: CircleDotIcon,
  },
  {
    value: 'done',
    name: 'Done',
    icon: CircleCheckIcon,
  },
] as const
