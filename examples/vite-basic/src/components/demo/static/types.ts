import type { IssueStatus } from '../shared/types'

export type Issue = {
  id: string
  title: string
  description?: string
  statusId: IssueStatus['id']
  labelIds?: string[]
  assigneeId?: string
  startDate?: Date
  endDate?: Date
  estimatedHours?: number
}
