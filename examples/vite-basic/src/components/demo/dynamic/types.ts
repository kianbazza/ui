import type { IssueLabel, IssueStatus, User } from '../shared/types'

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
