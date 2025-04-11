'use client'

import { cn } from '@/lib/utils'
import {
  DataTableFilter,
  useDataTableFilters,
} from '@/registry/data-table-filter-v2/components/data-table-filter'
import { createTSTColumns } from '@/registry/data-table-filter-v2/lib/filters-tst'
import type {
  ColumnOption,
  FiltersState,
} from '@/registry/data-table-filter-v2/lib/filters.types'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useQuery } from '@tanstack/react-query'
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { columnsConfig } from './column-filters'
import { LABEL_STYLES_MAP, type TW_COLOR, tstColumnDefs } from './columns'
import { DataTable } from './data-table'
import {
  fetchFacetedLabels,
  fetchFacetedStatuses,
  fetchFacetedUsers,
  fetchIssues,
  fetchLabels,
  fetchStatuses,
  fetchUsers,
} from './fetch'
import { TableSkeleton } from './table-skeleton'

export function IssuesTable({
  state,
}: {
  state: {
    filters: FiltersState
    setFilters: React.Dispatch<React.SetStateAction<FiltersState>>
  }
}) {
  const labels = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  })

  const statuses = useQuery({
    queryKey: ['statuses'],
    queryFn: fetchStatuses,
  })

  const users = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const facetedLabels = useQuery({
    queryKey: ['facetedLabels'],
    queryFn: fetchFacetedLabels,
  })

  const facetedStatuses = useQuery({
    queryKey: ['facetedStatuses'],
    queryFn: fetchFacetedStatuses,
  })

  const facetedUsers = useQuery({
    queryKey: ['facetedUsers'],
    queryFn: fetchFacetedUsers,
  })

  const issues = useQuery({
    queryKey: ['issues', state.filters],
    queryFn: () => fetchIssues(state.filters),
  })

  const labelOptions = labels.data?.map(
    (l) =>
      ({
        value: l.id,
        label: l.name,
        icon: (
          <div
            className={cn(
              'size-2.5 rounded-full',
              LABEL_STYLES_MAP[l.color as TW_COLOR],
            )}
          />
        ),
      }) satisfies ColumnOption,
  )

  const statusOptions = statuses.data?.map(
    (s) =>
      ({
        value: s.id,
        label: s.name,
        icon: s.icon,
      }) satisfies ColumnOption,
  )

  const userOptions = users.data?.map(
    (u) =>
      ({
        value: u.id,
        label: u.name,
        icon: (
          <Avatar className="size-4">
            <AvatarImage src={u.picture} />
            <AvatarFallback>
              {u.name
                .split(' ')
                .map((x) => x[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      }) satisfies ColumnOption,
  )

  const isOptionsPending =
    labels.isPending ||
    statuses.isPending ||
    users.isPending ||
    facetedLabels.isPending ||
    facetedStatuses.isPending ||
    facetedUsers.isPending

  const { columns, filters, actions, strategy } = useDataTableFilters({
    strategy: 'server',
    data: issues.data ?? [],
    columnsConfig,
    controlledState: [state.filters, state.setFilters],
    options: {
      status: [statusOptions, facetedStatuses.data],
      assignee: [userOptions, facetedUsers.data],
      labels: [labelOptions, facetedLabels.data],
    },
  })

  const [rowSelection, setRowSelection] = useState({})

  const tstColumns = useMemo(() => {
    console.log('[DataTableDemo] Creating TST columns')
    return createTSTColumns({
      columns: tstColumnDefs,
      configs: columns,
    })
  }, [columns])

  const table = useReactTable({
    data: issues.data ?? [],
    columns: tstColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  return (
    <div className="w-full col-span-2">
      {!isOptionsPending && (
        <div className="flex items-center pb-4 gap-2">
          <DataTableFilter
            filters={filters}
            columns={columns}
            actions={actions}
            strategy={strategy}
          />
        </div>
      )}
      {issues.isLoading ? (
        <div className="w-full col-span-2">
          <TableSkeleton numCols={tstColumns.length} numRows={10} />
        </div>
      ) : (
        <DataTable table={table} />
      )}
    </div>
  )
}
