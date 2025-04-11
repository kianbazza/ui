import type { FiltersState } from '@/registry/data-table-filter-v2/lib/filters.types'
import type { QueryOptions } from '@tanstack/react-query'
import {
  fetchFacetedLabels,
  fetchFacetedStatuses,
  fetchFacetedUsers,
  fetchIssues,
  fetchLabels,
  fetchStatuses,
  fetchUsers,
} from './fetch'

export const queries = {
  issues: {
    all: (filters?: FiltersState) =>
      ({
        queryKey: ['issues', filters],
        queryFn: () => fetchIssues(filters),
      }) satisfies QueryOptions,
  },
  statuses: {
    all: () => ({
      queryKey: ['statuses'],
      queryFn: () => fetchStatuses(),
    }),
    faceted: () =>
      ({
        queryKey: ['statuses', 'faceted'],
        queryFn: () => fetchFacetedStatuses(),
      }) satisfies QueryOptions,
  },
  labels: {
    all: () => ({
      queryKey: ['labels'],
      queryFn: () => fetchLabels(),
    }),
    faceted: () =>
      ({
        queryKey: ['labels', 'faceted'],
        queryFn: () => fetchFacetedLabels(),
      }) satisfies QueryOptions,
  },
  users: {
    all: () =>
      ({
        queryKey: ['users'],
        queryFn: () => fetchUsers(),
      }) satisfies QueryOptions,
    faceted: () =>
      ({
        queryKey: ['users', 'faceted'],
        queryFn: () => fetchFacetedUsers(),
      }) satisfies QueryOptions,
  },
}
