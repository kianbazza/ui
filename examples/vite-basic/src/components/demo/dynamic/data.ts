import { lorem } from '@ndaidong/txtgen'
import { add, differenceInDays, sub } from 'date-fns'
import { nanoid } from 'nanoid'
import { randomInteger, sample } from 'remeda'
import { ISSUE_LABELS, ISSUE_STATUSES, USERS } from '../shared/data'
import type { IssueLabel } from '../shared/types'
import { isAnyOf } from '../shared/utils'
import type { Issue } from './types'

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

export const ISSUES = generateIssues(30)
