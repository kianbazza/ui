'use client'

import { use, useState } from 'react'

import { CodeBlock } from '@/components/code-block'
import { print } from '@/lib/utils'
import { useDataTableFilters } from '@/registry/data-table-filter-v2/components/data-table-filter'
import { createColumns } from '@/registry/data-table-filter-v2/lib/filters'
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { columnsConfig, columns as tableColumns } from './columns'
import { ISSUES } from './data'
import DataTable from './data-table'

export default function DataTableDemo() {
  // const [sorting, setSorting] = useState<SortingState>([])
  // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  // const [globalFilter, setGlobalFilter] = useState('')
  // const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: ISSUES,
    columns: tableColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // getSortedRowModel: getSortedRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    // getFacetedRowModel: getFacetedRowModel(),
    // getFacetedMinMaxValues: getFacetedMinMaxValues(),
    // onSortingChange: setSorting,
    // onColumnFiltersChange: setColumnFilters,
    // onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    // onGlobalFilterChange: setGlobalFilter,
    state: {
      // sorting,
      // columnFilters,
      // globalFilter,
      // columnVisibility,
      rowSelection,
    },
  })

  const cols = createColumns(ISSUES, columnsConfig)
  const { filters, columns, actions } = useDataTableFilters({
    data: ISSUES,
    columns: cols,
  })

  return (
    <div className="grid grid-cols-2 gap-8">
      <DataTable
        table={table}
        filters={filters}
        columns={columns}
        actions={actions}
      />
      <CodeBlock lang="json" code={print(filters)} />
    </div>
  )
}
