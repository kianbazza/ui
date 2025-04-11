import type { LucideIcon } from 'lucide-react'

export type Issue = {
  id: string
  title: string
  description?: string
  status: IssueStatus
  labels?: IssueLabel[]
  assignee?: User
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
}

export type User = {
  id: string
  name: string
  picture: string
}

export type IssueLabel = {
  id: string
  name: string
  color: string
}

export type IssueStatus = {
  id: 'backlog' | 'todo' | 'in-progress' | 'done'
  name: string
  order: number
  icon: LucideIcon
}
