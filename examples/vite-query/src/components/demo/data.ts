import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from 'lucide-react'
import type { Issue, IssueLabel, IssueStatus, User } from './types'
import { lorem } from '@ndaidong/txtgen'
import { sample, randomInteger } from 'remeda'
import { nanoid } from 'nanoid'
import { isAnyOf } from './utils'
import { add, differenceInDays, sub } from 'date-fns'

export const calculateEndDate = (start: Date) => {
  const diff = differenceInDays(new Date(), start)
  const offset = randomInteger(0, diff + 1)

  return add(start, { days: offset })
}

export function generateSampleIssue(): Issue {
  const title = lorem(4, 8)
  const description = lorem(4, 8)

  const labelsCount = randomInteger(0, 5)
  const labels =
    labelsCount > 0
      ? (sample(ISSUE_LABELS, labelsCount) as IssueLabel[])
      : undefined
  // const labelIds = labels?.map((l) => l.id)

  let [assignee] = sample(USERS, 1)
  if (!assignee) throw new Error('No assignee found')
  assignee = Math.random() > 0.5 ? assignee : undefined
  const assigneeId = assignee?.id

  const [status] = sample(ISSUE_STATUSES, 1)
  if (!status) throw new Error('No status found')

  const startDate = isAnyOf(status.id, ['backlog', 'todo'])
    ? undefined
    : sub(new Date(), { days: randomInteger(10, 60) })

  const endDate =
    !startDate || status.id !== 'done' ? undefined : calculateEndDate(startDate)

  const estimatedHours = randomInteger(1, 16)

  return {
    id: nanoid(),
    title,
    description,
    status,
    labels,
    assigneeId,
    startDate,
    endDate,
    estimatedHours,
  }
}

export const USERS: User[] = [
  {
    id: nanoid(),
    name: 'John Smith',
    picture: '/avatars/john-smith.png',
  },
  {
    id: nanoid(),
    name: 'Rose Eve',
    picture: '/avatars/rose-eve.png',
  },
  {
    id: nanoid(),
    name: 'Adam Young',
    picture: '/avatars/adam-young.png',
  },
  {
    id: nanoid(),
    name: 'Michael Scott',
    picture: '/avatars/michael-scott.png',
  },
] as const

export const ISSUE_STATUSES: IssueStatus[] = [
  {
    id: 'backlog',
    name: 'Backlog',
    icon: CircleDashedIcon,
  },
  {
    id: 'todo',
    name: 'Todo',
    icon: CircleIcon,
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: CircleDotIcon,
  },
  {
    id: 'done',
    name: 'Done',
    icon: CircleCheckIcon,
  },
] as const

export const ISSUE_LABELS: IssueLabel[] = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bug', color: '#FF5733' },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Enhancement',
    color: '#33FF57',
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    name: 'Task',
    color: '#3357FF',
  },
  {
    id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    name: 'Urgent',
    color: '#FF33A1',
  },
  {
    id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
    name: 'Low Priority',
    color: '#A1FF33',
  },
  {
    id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
    name: 'Frontend',
    color: '#FF8C33',
  },
  {
    id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
    name: 'Backend',
    color: '#33FFB5',
  },
  {
    id: '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
    name: 'Database',
    color: '#5733FF',
  },
  { id: '6ba7b817-9dad-11d1-80b4-00c04fd430c8', name: 'API', color: '#FF3333' },
  {
    id: '6ba7b818-9dad-11d1-80b4-00c04fd430c8',
    name: 'AI Model',
    color: '#33D4FF',
  },
  {
    id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Pipeline',
    color: '#FF9633',
  },
  {
    id: '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Inference',
    color: '#33FF8C',
  },
  {
    id: '6ba7b81b-9dad-11d1-80b4-00c04fd430c8',
    name: 'AI Integration',
    color: '#8C33FF',
  },
  {
    id: '6ba7b81c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Ethics',
    color: '#FF33D4',
  },
  {
    id: '6ba7b81d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Refactor',
    color: '#33FFA1',
  },
  {
    id: '6ba7b81e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Performance',
    color: '#FF5733',
  },
  {
    id: '6ba7b81f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Security',
    color: '#33A1FF',
  },
  {
    id: '6ba7b820-9dad-11d1-80b4-00c04fd430c8',
    name: 'Testing',
    color: '#D4FF33',
  },
  {
    id: '6ba7b821-9dad-11d1-80b4-00c04fd430c8',
    name: 'Documentation',
    color: '#FF338C',
  },
  {
    id: '6ba7b822-9dad-11d1-80b4-00c04fd430c8',
    name: 'In Progress',
    color: '#33FF57',
  },
  {
    id: '6ba7b823-9dad-11d1-80b4-00c04fd430c8',
    name: 'Blocked',
    color: '#A133FF',
  },
  {
    id: '6ba7b824-9dad-11d1-80b4-00c04fd430c8',
    name: 'Needs Review',
    color: '#FF8C33',
  },
  {
    id: '6ba7b825-9dad-11d1-80b4-00c04fd430c8',
    name: 'Done',
    color: '#33FFD4',
  },
  { id: '6ba7b826-9dad-11d1-80b4-00c04fd430c8', name: 'UI', color: '#FF3333' },
  { id: '6ba7b827-9dad-11d1-80b4-00c04fd430c8', name: 'UX', color: '#33A1FF' },
  {
    id: '6ba7b828-9dad-11d1-80b4-00c04fd430c8',
    name: 'Accessibility',
    color: '#FF5733',
  },
  {
    id: '6ba7b829-9dad-11d1-80b4-00c04fd430c8',
    name: 'Deployment',
    color: '#33FF8C',
  },
  {
    id: '6ba7b82a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Infrastructure',
    color: '#8C33FF',
  },
  {
    id: '6ba7b82b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Monitoring',
    color: '#FF33A1',
  },
  {
    id: '6ba7b82c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Real-Time',
    color: '#33FFA1',
  },
  {
    id: '6ba7b82d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Scalability',
    color: '#FF9633',
  },
  {
    id: '6ba7b82e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Third-Party',
    color: '#33D4FF',
  },
  {
    id: '6ba7b82f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Authentication',
    color: '#FF338C',
  },
  {
    id: '6ba7b830-9dad-11d1-80b4-00c04fd430c8',
    name: 'Authorization',
    color: '#33FF57',
  },
  {
    id: '6ba7b831-9dad-11d1-80b4-00c04fd430c8',
    name: 'Caching',
    color: '#A1FF33',
  },
  {
    id: '6ba7b832-9dad-11d1-80b4-00c04fd430c8',
    name: 'Logging',
    color: '#FF5733',
  },
  {
    id: '6ba7b833-9dad-11d1-80b4-00c04fd430c8',
    name: 'Analytics',
    color: '#33A1FF',
  },
  {
    id: '6ba7b834-9dad-11d1-80b4-00c04fd430c8',
    name: 'Feature Request',
    color: '#FF8C33',
  },
  {
    id: '6ba7b835-9dad-11d1-80b4-00c04fd430c8',
    name: 'Regression',
    color: '#33FFD4',
  },
  {
    id: '6ba7b836-9dad-11d1-80b4-00c04fd430c8',
    name: 'Hotfix',
    color: '#FF3333',
  },
  {
    id: '6ba7b837-9dad-11d1-80b4-00c04fd430c8',
    name: 'Code Review',
    color: '#33FF8C',
  },
  {
    id: '6ba7b838-9dad-11d1-80b4-00c04fd430c8',
    name: 'Tech Debt',
    color: '#8C33FF',
  },
  {
    id: '6ba7b839-9dad-11d1-80b4-00c04fd430c8',
    name: 'Migration',
    color: '#FF33A1',
  },
  {
    id: '6ba7b83a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Configuration',
    color: '#33FFA1',
  },
  {
    id: '6ba7b83b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Validation',
    color: '#FF9633',
  },
  {
    id: '6ba7b83c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Input Handling',
    color: '#33D4FF',
  },
  {
    id: '6ba7b83d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Error Handling',
    color: '#FF338C',
  },
  {
    id: '6ba7b83e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Session Management',
    color: '#33FF57',
  },
  {
    id: '6ba7b83f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Concurrency',
    color: '#A1FF33',
  },
  {
    id: '6ba7b840-9dad-11d1-80b4-00c04fd430c8',
    name: 'Load Balancing',
    color: '#FF5733',
  },
  {
    id: '6ba7b841-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Migration',
    color: '#33A1FF',
  },
  {
    id: '6ba7b842-9dad-11d1-80b4-00c04fd430c8',
    name: 'Model Training',
    color: '#FF8C33',
  },
  {
    id: '6ba7b843-9dad-11d1-80b4-00c04fd430c8',
    name: 'Hyperparameters',
    color: '#33FFD4',
  },
  {
    id: '6ba7b844-9dad-11d1-80b4-00c04fd430c8',
    name: 'Overfitting',
    color: '#FF3333',
  },
  {
    id: '6ba7b845-9dad-11d1-80b4-00c04fd430c8',
    name: 'Underfitting',
    color: '#33FF8C',
  },
  {
    id: '6ba7b846-9dad-11d1-80b4-00c04fd430c8',
    name: 'Feature Engineering',
    color: '#8C33FF',
  },
  {
    id: '6ba7b847-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Quality',
    color: '#FF33A1',
  },
  {
    id: '6ba7b848-9dad-11d1-80b4-00c04fd430c8',
    name: 'Preprocessing',
    color: '#33FFA1',
  },
  {
    id: '6ba7b849-9dad-11d1-80b4-00c04fd430c8',
    name: 'Model Deployment',
    color: '#FF9633',
  },
  {
    id: '6ba7b84a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Latency',
    color: '#33D4FF',
  },
  {
    id: '6ba7b84b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Throughput',
    color: '#FF338C',
  },
  {
    id: '6ba7b84c-9dad-11d1-80b4-00c04fd430c8',
    name: 'API Versioning',
    color: '#33FF57',
  },
  {
    id: '6ba7b84d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Rate Limiting',
    color: '#A1FF33',
  },
  {
    id: '6ba7b84e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Throttling',
    color: '#FF5733',
  },
  {
    id: '6ba7b84f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Retry Logic',
    color: '#33A1FF',
  },
  {
    id: '6ba7b850-9dad-11d1-80b4-00c04fd430c8',
    name: 'Fallback',
    color: '#FF8C33',
  },
  {
    id: '6ba7b851-9dad-11d1-80b4-00c04fd430c8',
    name: 'Circuit Breaker',
    color: '#33FFD4',
  },
  {
    id: '6ba7b852-9dad-11d1-80b4-00c04fd430c8',
    name: 'Queue Management',
    color: '#FF3333',
  },
  {
    id: '6ba7b853-9dad-11d1-80b4-00c04fd430c8',
    name: 'Batch Processing',
    color: '#33FF8C',
  },
  {
    id: '6ba7b854-9dad-11d1-80b4-00c04fd430c8',
    name: 'Streaming',
    color: '#8C33FF',
  },
  {
    id: '6ba7b855-9dad-11d1-80b4-00c04fd430c8',
    name: 'Event Handling',
    color: '#FF33A1',
  },
  {
    id: '6ba7b856-9dad-11d1-80b4-00c04fd430c8',
    name: 'WebSocket',
    color: '#33FFA1',
  },
  {
    id: '6ba7b857-9dad-11d1-80b4-00c04fd430c8',
    name: 'Cron Job',
    color: '#FF9633',
  },
  {
    id: '6ba7b858-9dad-11d1-80b4-00c04fd430c8',
    name: 'Scheduled Task',
    color: '#33D4FF',
  },
  {
    id: '6ba7b859-9dad-11d1-80b4-00c04fd430c8',
    name: 'File Upload',
    color: '#FF338C',
  },
  {
    id: '6ba7b85a-9dad-11d1-80b4-00c04fd430c8',
    name: 'File Processing',
    color: '#33FF57',
  },
  {
    id: '6ba7b85b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Export',
    color: '#A1FF33',
  },
  {
    id: '6ba7b85c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Import',
    color: '#FF5733',
  },
  {
    id: '6ba7b85d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Localization',
    color: '#33A1FF',
  },
  {
    id: '6ba7b85e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Internationalization',
    color: '#FF8C33',
  },
  {
    id: '6ba7b85f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Notifications',
    color: '#33FFD4',
  },
  {
    id: '6ba7b860-9dad-11d1-80b4-00c04fd430c8',
    name: 'Email',
    color: '#FF3333',
  },
  {
    id: '6ba7b861-9dad-11d1-80b4-00c04fd430c8',
    name: 'Push Notifications',
    color: '#33FF8C',
  },
  { id: '6ba7b862-9dad-11d1-80b4-00c04fd430c8', name: 'SMS', color: '#8C33FF' },
  {
    id: '6ba7b863-9dad-11d1-80b4-00c04fd430c8',
    name: 'Audit Log',
    color: '#FF33A1',
  },
  {
    id: '6ba7b864-9dad-11d1-80b4-00c04fd430c8',
    name: 'Backup',
    color: '#33FFA1',
  },
  {
    id: '6ba7b865-9dad-11d1-80b4-00c04fd430c8',
    name: 'Restore',
    color: '#FF9633',
  },
  {
    id: '6ba7b866-9dad-11d1-80b4-00c04fd430c8',
    name: 'Disaster Recovery',
    color: '#33D4FF',
  },
  {
    id: '6ba7b867-9dad-11d1-80b4-00c04fd430c8',
    name: 'Compliance',
    color: '#FF338C',
  },
  {
    id: '6ba7b868-9dad-11d1-80b4-00c04fd430c8',
    name: 'GDPR',
    color: '#33FF57',
  },
  {
    id: '6ba7b869-9dad-11d1-80b4-00c04fd430c8',
    name: 'HIPAA',
    color: '#A1FF33',
  },
  {
    id: '6ba7b86a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Debugging',
    color: '#FF5733',
  },
  {
    id: '6ba7b86b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Profiling',
    color: '#33A1FF',
  },
  {
    id: '6ba7b86c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Optimization',
    color: '#FF8C33',
  },
  {
    id: '6ba7b86d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Research',
    color: '#33FFD4',
  },
  {
    id: '6ba7b86e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Experiment',
    color: '#FF3333',
  },
  {
    id: '6ba7b86f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Proof of Concept',
    color: '#33FF8C',
  },
]

export function generateIssues(count: number) {
  const arr: Issue[] = []

  for (let i = 0; i < count; i++) {
    arr.push(generateSampleIssue())
  }

  return arr
}

export const ISSUES = generateIssues(100)
