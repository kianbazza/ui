import { ISSUE_LABELS, ISSUE_STATUSES, USERS, generateIssues } from './data'

const ISSUES = generateIssues(100)

export async function fetchIssues() {
  return ISSUES
}

export async function fetchLabels() {
  return ISSUE_LABELS
}

export async function fetchUsers() {
  return USERS
}

export async function fetchStatuses() {
  return ISSUE_STATUSES
}
