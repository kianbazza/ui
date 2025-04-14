import { lorem } from '@ndaidong/txtgen'
import { sub } from 'date-fns'
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { randomInteger, sample } from 'remeda'
import type { Issue, IssueLabel, IssueStatus, User } from './types'
import { calculateEndDate, isAnyOf } from './utils'

export const USERS: User[] = [
  {
    id: 'rmraOG0B-2xSUyJ3e73mv',
    name: 'John Smith',
    picture: '/avatars/john-smith.png',
  },
  {
    id: '4_vjFSibR5YkkQiHafaLx',
    name: 'Rose Eve',
    picture: '/avatars/rose-eve.png',
  },
  {
    id: 'RC9mraUl-oJECORIjeNbd',
    name: 'Adam Young',
    picture: '/avatars/adam-young.png',
  },
  {
    id: 'hhkjn-3L9bKDbl1FKuZW0',
    name: 'Michael Scott',
    picture: '/avatars/michael-scott.png',
  },
] as const

export const ISSUE_STATUSES: IssueStatus[] = [
  {
    id: 'backlog',
    name: 'Backlog',
    icon: CircleDashedIcon,
    order: 1,
  },
  {
    id: 'todo',
    name: 'Todo',
    icon: CircleIcon,
    order: 2,
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    icon: CircleDotIcon,
    order: 3,
  },
  {
    id: 'done',
    name: 'Done',
    icon: CircleCheckIcon,
    order: 4,
  },
] as const

export const ISSUE_LABELS: IssueLabel[] = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bug', color: 'red' },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'Enhancement',
    color: 'green',
  },
  { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: 'Task', color: 'blue' },
  { id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8', name: 'Urgent', color: 'pink' },
  {
    id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
    name: 'Low Priority',
    color: 'lime',
  },
  {
    id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
    name: 'Frontend',
    color: 'orange',
  },
  {
    id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
    name: 'Backend',
    color: 'teal',
  },
  {
    id: '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
    name: 'Database',
    color: 'violet',
  },
  { id: '6ba7b817-9dad-11d1-80b4-00c04fd430c8', name: 'API', color: 'red' },
  {
    id: '6ba7b818-9dad-11d1-80b4-00c04fd430c8',
    name: 'AI Model',
    color: 'cyan',
  },
  {
    id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Pipeline',
    color: 'amber',
  },
  {
    id: '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Inference',
    color: 'emerald',
  },
  {
    id: '6ba7b81b-9dad-11d1-80b4-00c04fd430c8',
    name: 'AI Integration',
    color: 'purple',
  },
  {
    id: '6ba7b81c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Ethics',
    color: 'fuchsia',
  },
  {
    id: '6ba7b81d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Refactor',
    color: 'lime',
  },
  {
    id: '6ba7b81e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Performance',
    color: 'red',
  },
  {
    id: '6ba7b81f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Security',
    color: 'sky',
  },
  {
    id: '6ba7b820-9dad-11d1-80b4-00c04fd430c8',
    name: 'Testing',
    color: 'yellow',
  },
  {
    id: '6ba7b821-9dad-11d1-80b4-00c04fd430c8',
    name: 'Documentation',
    color: 'rose',
  },
  {
    id: '6ba7b822-9dad-11d1-80b4-00c04fd430c8',
    name: 'In Progress',
    color: 'green',
  },
  {
    id: '6ba7b823-9dad-11d1-80b4-00c04fd430c8',
    name: 'Blocked',
    color: 'indigo',
  },
  {
    id: '6ba7b824-9dad-11d1-80b4-00c04fd430c8',
    name: 'Needs Review',
    color: 'orange',
  },
  { id: '6ba7b825-9dad-11d1-80b4-00c04fd430c8', name: 'Done', color: 'teal' },
  { id: '6ba7b826-9dad-11d1-80b4-00c04fd430c8', name: 'UI', color: 'red' },
  { id: '6ba7b827-9dad-11d1-80b4-00c04fd430c8', name: 'UX', color: 'sky' },
  {
    id: '6ba7b828-9dad-11d1-80b4-00c04fd430c8',
    name: 'Accessibility',
    color: 'red',
  },
  {
    id: '6ba7b829-9dad-11d1-80b4-00c04fd430c8',
    name: 'Deployment',
    color: 'emerald',
  },
  {
    id: '6ba7b82a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Infrastructure',
    color: 'purple',
  },
  {
    id: '6ba7b82b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Monitoring',
    color: 'pink',
  },
  {
    id: '6ba7b82c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Real-Time',
    color: 'lime',
  },
  {
    id: '6ba7b82d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Scalability',
    color: 'amber',
  },
  {
    id: '6ba7b82e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Third-Party',
    color: 'cyan',
  },
  {
    id: '6ba7b82f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Authentication',
    color: 'rose',
  },
  {
    id: '6ba7b830-9dad-11d1-80b4-00c04fd430c8',
    name: 'Authorization',
    color: 'green',
  },
  {
    id: '6ba7b831-9dad-11d1-80b4-00c04fd430c8',
    name: 'Caching',
    color: 'lime',
  },
  { id: '6ba7b832-9dad-11d1-80b4-00c04fd430c8', name: 'Logging', color: 'red' },
  {
    id: '6ba7b833-9dad-11d1-80b4-00c04fd430c8',
    name: 'Analytics',
    color: 'sky',
  },
  {
    id: '6ba7b834-9dad-11d1-80b4-00c04fd430c8',
    name: 'Feature Request',
    color: 'orange',
  },
  {
    id: '6ba7b835-9dad-11d1-80b4-00c04fd430c8',
    name: 'Regression',
    color: 'teal',
  },
  { id: '6ba7b836-9dad-11d1-80b4-00c04fd430c8', name: 'Hotfix', color: 'red' },
  {
    id: '6ba7b837-9dad-11d1-80b4-00c04fd430c8',
    name: 'Code Review',
    color: 'emerald',
  },
  {
    id: '6ba7b838-9dad-11d1-80b4-00c04fd430c8',
    name: 'Tech Debt',
    color: 'purple',
  },
  {
    id: '6ba7b839-9dad-11d1-80b4-00c04fd430c8',
    name: 'Migration',
    color: 'pink',
  },
  {
    id: '6ba7b83a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Configuration',
    color: 'lime',
  },
  {
    id: '6ba7b83b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Validation',
    color: 'amber',
  },
  {
    id: '6ba7b83c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Input Handling',
    color: 'cyan',
  },
  {
    id: '6ba7b83d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Error Handling',
    color: 'rose',
  },
  {
    id: '6ba7b83e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Session Management',
    color: 'green',
  },
  {
    id: '6ba7b83f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Concurrency',
    color: 'lime',
  },
  {
    id: '6ba7b840-9dad-11d1-80b4-00c04fd430c8',
    name: 'Load Balancing',
    color: 'red',
  },
  {
    id: '6ba7b841-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Migration',
    color: 'sky',
  },
  {
    id: '6ba7b842-9dad-11d1-80b4-00c04fd430c8',
    name: 'Model Training',
    color: 'orange',
  },
  {
    id: '6ba7b843-9dad-11d1-80b4-00c04fd430c8',
    name: 'Hyperparameters',
    color: 'teal',
  },
  {
    id: '6ba7b844-9dad-11d1-80b4-00c04fd430c8',
    name: 'Overfitting',
    color: 'red',
  },
  {
    id: '6ba7b845-9dad-11d1-80b4-00c04fd430c8',
    name: 'Underfitting',
    color: 'emerald',
  },
  {
    id: '6ba7b846-9dad-11d1-80b4-00c04fd430c8',
    name: 'Feature Engineering',
    color: 'purple',
  },
  {
    id: '6ba7b847-9dad-11d1-80b4-00c04fd430c8',
    name: 'Data Quality',
    color: 'pink',
  },
  {
    id: '6ba7b848-9dad-11d1-80b4-00c04fd430c8',
    name: 'Preprocessing',
    color: 'lime',
  },
  {
    id: '6ba7b849-9dad-11d1-80b4-00c04fd430c8',
    name: 'Model Deployment',
    color: 'amber',
  },
  {
    id: '6ba7b84a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Latency',
    color: 'cyan',
  },
  {
    id: '6ba7b84b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Throughput',
    color: 'rose',
  },
  {
    id: '6ba7b84c-9dad-11d1-80b4-00c04fd430c8',
    name: 'API Versioning',
    color: 'green',
  },
  {
    id: '6ba7b84d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Rate Limiting',
    color: 'lime',
  },
  {
    id: '6ba7b84e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Throttling',
    color: 'red',
  },
  {
    id: '6ba7b84f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Retry Logic',
    color: 'sky',
  },
  {
    id: '6ba7b850-9dad-11d1-80b4-00c04fd430c8',
    name: 'Fallback',
    color: 'orange',
  },
  {
    id: '6ba7b851-9dad-11d1-80b4-00c04fd430c8',
    name: 'Circuit Breaker',
    color: 'teal',
  },
  {
    id: '6ba7b852-9dad-11d1-80b4-00c04fd430c8',
    name: 'Queue Management',
    color: 'red',
  },
  {
    id: '6ba7b853-9dad-11d1-80b4-00c04fd430c8',
    name: 'Batch Processing',
    color: 'emerald',
  },
  {
    id: '6ba7b854-9dad-11d1-80b4-00c04fd430c8',
    name: 'Streaming',
    color: 'purple',
  },
  {
    id: '6ba7b855-9dad-11d1-80b4-00c04fd430c8',
    name: 'Event Handling',
    color: 'pink',
  },
  {
    id: '6ba7b856-9dad-11d1-80b4-00c04fd430c8',
    name: 'WebSocket',
    color: 'lime',
  },
  {
    id: '6ba7b857-9dad-11d1-80b4-00c04fd430c8',
    name: 'Cron Job',
    color: 'amber',
  },
  {
    id: '6ba7b858-9dad-11d1-80b4-00c04fd430c8',
    name: 'Scheduled Task',
    color: 'cyan',
  },
  {
    id: '6ba7b859-9dad-11d1-80b4-00c04fd430c8',
    name: 'File Upload',
    color: 'rose',
  },
  {
    id: '6ba7b85a-9dad-11d1-80b4-00c04fd430c8',
    name: 'File Processing',
    color: 'green',
  },
  { id: '6ba7b85b-9dad-11d1-80b4-00c04fd430c8', name: 'Export', color: 'lime' },
  { id: '6ba7b85c-9dad-11d1-80b4-00c04fd430c8', name: 'Import', color: 'red' },
  {
    id: '6ba7b85d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Localization',
    color: 'sky',
  },
  {
    id: '6ba7b85e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Internationalization',
    color: 'orange',
  },
  {
    id: '6ba7b85f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Notifications',
    color: 'teal',
  },
  { id: '6ba7b860-9dad-11d1-80b4-00c04fd430c8', name: 'Email', color: 'red' },
  {
    id: '6ba7b861-9dad-11d1-80b4-00c04fd430c8',
    name: 'Push Notifications',
    color: 'emerald',
  },
  { id: '6ba7b862-9dad-11d1-80b4-00c04fd430c8', name: 'SMS', color: 'purple' },
  {
    id: '6ba7b863-9dad-11d1-80b4-00c04fd430c8',
    name: 'Audit Log',
    color: 'pink',
  },
  { id: '6ba7b864-9dad-11d1-80b4-00c04fd430c8', name: 'Backup', color: 'lime' },
  {
    id: '6ba7b865-9dad-11d1-80b4-00c04fd430c8',
    name: 'Restore',
    color: 'amber',
  },
  {
    id: '6ba7b866-9dad-11d1-80b4-00c04fd430c8',
    name: 'Disaster Recovery',
    color: 'cyan',
  },
  {
    id: '6ba7b867-9dad-11d1-80b4-00c04fd430c8',
    name: 'Compliance',
    color: 'rose',
  },
  { id: '6ba7b868-9dad-11d1-80b4-00c04fd430c8', name: 'GDPR', color: 'green' },
  { id: '6ba7b869-9dad-11d1-80b4-00c04fd430c8', name: 'HIPAA', color: 'lime' },
  {
    id: '6ba7b86a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Debugging',
    color: 'red',
  },
  {
    id: '6ba7b86b-9dad-11d1-80b4-00c04fd430c8',
    name: 'Profiling',
    color: 'sky',
  },
  {
    id: '6ba7b86c-9dad-11d1-80b4-00c04fd430c8',
    name: 'Optimization',
    color: 'orange',
  },
  {
    id: '6ba7b86d-9dad-11d1-80b4-00c04fd430c8',
    name: 'Research',
    color: 'teal',
  },
  {
    id: '6ba7b86e-9dad-11d1-80b4-00c04fd430c8',
    name: 'Experiment',
    color: 'red',
  },
  {
    id: '6ba7b86f-9dad-11d1-80b4-00c04fd430c8',
    name: 'Proof of Concept',
    color: 'emerald',
  },
]

export function generateIssueTitle() {
  const verbs = [
    'Fix',
    'Add',
    'Improve',
    'Refactor',
    'Update',
    'Remove',
    'Implement',
    'Optimize',
    'Redesign',
    'Revert',
  ]
  const nouns = [
    'task sidebar',
    'project view',
    'keyboard shortcuts',
    'user permissions',
    'search performance',
    'issue modal',
    'auth flow',
    'API integration',
    'activity feed',
    'notifications',
    'team management',
    'board drag & drop',
    'custom workflows',
    'mobile responsiveness',
    'comment threading',
    'GitHub sync',
    'dark mode',
    'date picker',
    'status badges',
    'workspace settings',
  ]
  const suffixes = [
    'in Safari',
    'for enterprise customers',
    'on slow connections',
    'edge case in Firefox',
    'when duplicating issues',
    'for archived projects',
    'in mobile view',
    'on user onboarding',
    'when using keyboard nav',
    'for SSO users',
  ]

  const verb = verbs[Math.floor(Math.random() * verbs.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const suffix =
    Math.random() < 0.5
      ? ''
      : ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}`

  return `${verb} ${noun}${suffix}`
}

export function generateSampleIssue(): Issue {
  // const title = lorem(4, 8)
  const title = generateIssueTitle()
  const description = lorem(4, 8)

  const labelsCount = randomInteger(0, 5)
  const labels =
    labelsCount > 0
      ? (sample(ISSUE_LABELS, labelsCount) as IssueLabel[])
      : undefined

  let [assignee] = sample(USERS, 1)
  if (!assignee) throw new Error('No assignee found')
  assignee = Math.random() > 0.5 ? assignee : undefined

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
    assignee,
    startDate,
    endDate,
    estimatedHours,
  }
}

export function generateIssues(count: number) {
  const arr: Issue[] = []

  for (let i = 0; i < count; i++) {
    arr.push(generateSampleIssue())
  }

  return arr
}
