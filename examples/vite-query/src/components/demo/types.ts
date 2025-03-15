import type { LucideIcon } from 'lucide-react'

export type User = {
  id: string
  name: string
  picture: string
}

// export type Issue = {
//   id: string
//   title: string
//   description?: string
//   statusId: 'backlog' | 'todo' | 'in-progress' | 'done'
//   labelIds?: string[]
//   assigneeId?: string
//   startDate?: Date
//   endDate?: Date
//   estimatedHours?: number
// }

export type Issue = {
  id: string
  title: string
  description?: string
  // statusId: 'backlog' | 'todo' | 'in-progress' | 'done'
  status: IssueStatus
  labels?: IssueLabel[]
  assigneeId?: string
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
}

export type IssueLabel = {
  id: string
  name: string
  color: string
}

export type IssueStatus = {
  id: string
  name: string
  icon: LucideIcon
}

// export const issueStatuses: IssueStatus[] = [
//   {
//     value: 'backlog',
//     name: 'Backlog',
//     icon: CircleDashedIcon,
//   },
//   {
//     value: 'todo',
//     name: 'Todo',
//     icon: CircleIcon,
//   },
//   {
//     value: 'in-progress',
//     name: 'In Progress',
//     icon: CircleDotIcon,
//   },
//   {
//     value: 'done',
//     name: 'Done',
//     icon: CircleCheckIcon,
//   },
// ] as const
