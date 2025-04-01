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
  assignee?: User
  labelIds?: string[]
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

export type IssueLabel = {
  value: string
  name: string
  color:
    | 'red'
    | 'orange'
    | 'amber'
    | 'yellow'
    | 'lime'
    | 'green'
    | 'emerald'
    | 'teal'
    | 'cyan'
    | 'sky'
    | 'blue'
    | 'indigo'
    | 'violet'
    | 'purple'
    | 'fuchsia'
    | 'pink'
    | 'rose'
    | 'neutral'
}

export const issueLabels: IssueLabel[] = [
  {
    value: 'bug',
    name: 'Bug',
    color: 'red',
  },
  {
    value: 'feature',
    name: 'Feature',
    color: 'green',
  },
  {
    value: 'enhancement',
    name: 'Enhancement',
    color: 'blue',
  },
  {
    value: 'docs',
    name: 'Documentation',
    color: 'neutral',
  },
  {
    value: 'performance',
    name: 'Performance',
    color: 'yellow',
  },
  {
    value: 'security',
    name: 'Security',
    color: 'orange',
  },
  {
    value: 'ui',
    name: 'User Interface',
    color: 'cyan',
  },
  {
    value: 'testing',
    name: 'Testing',
    color: 'purple',
  },
  {
    value: 'refactor',
    name: 'Refactor',
    color: 'indigo',
  },
  {
    value: 'urgent',
    name: 'Urgent',
    color: 'rose',
  },
  {
    value: 'database',
    name: 'Database',
    color: 'teal',
  },
  {
    value: 'api',
    name: 'API',
    color: 'violet',
  },
]
