'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  DataTableFilter,
  useDataTableFilters,
} from '@/registry/data-table-filter'
import type { FiltersState } from '@/registry/data-table-filter/core/types'
import { createTSTColumns } from '@/registry/data-table-filter/integrations/tanstack-table'
import { useQuery } from '@tanstack/react-query'
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { LABEL_STYLES_MAP, type TW_COLOR, tstColumnDefs } from './columns'
import { DataTable } from './data-table'
import { columnsConfig } from './filters'
import { queries } from './queries'
import { TableFilterSkeleton, TableSkeleton } from './table-skeleton'
import type { IssueLabel, IssueStatus, User } from './types'

function createLabelOptions(labels: IssueLabel[] | undefined) {
  return labels?.map((l) => ({
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
  }))
}

function createStatusOptions(statuses: IssueStatus[] | undefined) {
  return statuses?.map((s) => ({
    value: s.id,
    label: s.name,
    icon: s.icon,
  }))
}

function createUserOptions(users: User[] | undefined) {
  return users?.map((u) => ({
    value: u.id,
    label: u.name,
    icon: (
      <Avatar key={u.id} className="size-4">
        <AvatarImage src={u.picture} />
        <AvatarFallback>
          {u.name
            .split('')
            .map((x) => x[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ),
  }))
}

export function IssuesTable({
  state,
}: {
  state: {
    filters: FiltersState
    setFilters: React.Dispatch<React.SetStateAction<FiltersState>>
  }
}) {
  /* Step 1: Fetch data from the server */
  const labels = useQuery(queries.labels.all())
  const statuses = useQuery(queries.statuses.all())
  const users = useQuery(queries.users.all())

  const facetedLabels = useQuery(queries.labels.faceted())
  const facetedStatuses = useQuery(queries.statuses.faceted())
  const facetedUsers = useQuery(queries.users.faceted())

  const issues = useQuery(queries.issues.all(state.filters))

  /* Step 2: Create ColumnOption[] for each option-based column */
  const labelOptions = createLabelOptions(labels.data)
  const statusOptions = createStatusOptions(statuses.data)
  const userOptions = createUserOptions(users.data)

  const isOptionsDataPending =
    labels.isPending ||
    statuses.isPending ||
    users.isPending ||
    facetedLabels.isPending ||
    facetedStatuses.isPending ||
    facetedUsers.isPending

  /*
   * Step 3: Create our data table filters instance
   *
   * This instance will handle the logic for filtering the data and updating the filters state.
   * We expose an `options` prop to provide the options for each column dynamically, after fetching them above.
   * It exposes our filters state, for you to pass on as you wish - e.g. to a TanStack Table instance.
   */
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

  /*
   * Step 4: Extend our TanStack Table columns with custom filter functions (and more!)
   *
   * You can use our integration hook for this.
   */
  const tstColumns = useMemo(
    () =>
      createTSTColumns({
        columns: tstColumnDefs,
        configs: columns,
      }),
    [columns],
  )

  /* Step 5: Create our TanStack Table instance */
  const [rowSelection, setRowSelection] = useState({})
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

  /* Step 6: Render the table! */
  return (
    <div className="w-full col-span-2">
      <div className="flex items-center pb-4 gap-2">
        {isOptionsDataPending ? (
          <TableFilterSkeleton />
        ) : (
          <DataTableFilter
            filters={filters}
            columns={columns}
            actions={actions}
            strategy={strategy}
          />
        )}
      </div>
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
