import type { IssueLabel, IssueStatus } from '../shared/types'

export type Issue = {
  id: string
  title: string
  description?: string
  status: IssueStatus
  labels?: IssueLabel[]
  assigneeId?: string
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
}
