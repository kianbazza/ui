import type { LucideIcon } from 'lucide-react'

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
  icon: LucideIcon
}
