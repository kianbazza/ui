export type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'done'

export type Issue = {
  id: string
  title: string
  status: IssueStatus
  dueDate?: Date
  estimatedHours?: number
}
