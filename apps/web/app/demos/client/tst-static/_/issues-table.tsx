'use client'

import {
  DataTableFilter,
  useDataTableFilters,
} from '@/registry/data-table-filter-v2'
import type { FiltersState } from '@/registry/data-table-filter-v2/core/types'
import {
  createTSTColumns,
  createTSTFilters,
} from '@/registry/data-table-filter-v2/integrations/tanstack-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { tstColumnDefs } from './columns'
import { ISSUES } from './data'
import { DataTable } from './data-table'
import { columnsConfig } from './filters'

export function IssuesTable({
  state,
}: {
  state: {
    filters: FiltersState
    setFilters: React.Dispatch<React.SetStateAction<FiltersState>>
  }
}) {
  const { columns, filters, actions, strategy } = useDataTableFilters({
    strategy: 'client',
    data: ISSUES,
    columnsConfig,
    controlledState: [state.filters, state.setFilters],
  })

  // Step 4: Extend our TanStack Table columns with custom filter functions (and more!)
  //         using our integration hook.
  const tstColumns = useMemo(
    () =>
      createTSTColumns({
        columns: tstColumnDefs,
        configs: columns,
      }),
    [columns],
  )

  const tstFilters = useMemo(() => createTSTFilters(filters), [filters])

  // Step 5: Create our TanStack Table instance
  const [rowSelection, setRowSelection] = useState({})
  const table = useReactTable({
    data: ISSUES,
    columns: tstColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnFilters: tstFilters,
    },
  })

  // Step 6: Render the table!
  return (
    <div className="w-full col-span-2">
      <div className="flex items-center pb-4 gap-2">
        <DataTableFilter
          filters={filters}
          columns={columns}
          actions={actions}
          strategy={strategy}
        />
      </div>
      <DataTable table={table} />
    </div>
  )
}
