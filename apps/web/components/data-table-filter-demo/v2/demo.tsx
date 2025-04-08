'use client'

import { use, useEffect, useMemo, useState } from 'react'

import { CodeBlock } from '@/components/code-block'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { print } from '@/lib/utils'
import { useDataTableFilters } from '@/registry/data-table-filter-v2/components/data-table-filter'
import {
  createTSTColumns,
  createTSTFilters,
} from '@/registry/data-table-filter-v2/lib/filters-tst'
import type { FiltersState } from '@/registry/data-table-filter-v2/lib/filters.types'
import {
  type ColumnDef,
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
import { useSearchParams } from 'next/navigation'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { columnsConfig, columns as tableColumns } from './columns'
import { ISSUES } from './data'
import DataTable from './data-table'
import type { Issue } from './types'

interface DemoConfig {
  state: 'internal' | 'external' | 'nuqs'
}

const filtersSchema = z
  .object({
    columnId: z.string(),
    operator: z.string(),
    values: z.array(z.any()),
  })
  .array()
  .min(0)

type FiltersSchema = z.infer<typeof filtersSchema>

const demoConfigSchema = z.object({
  state: z.enum(['internal', 'external', 'nuqs']),
})

export default function DataTableDemo() {
  const [rowSelection, setRowSelection] = useState({})

  const [config, setConfig] = useQueryState<DemoConfig>(
    'demoConfig',
    parseAsJson(demoConfigSchema.parse).withDefault({ state: 'internal' }),
  )

  const [columnFiltersExternal, setColumnFiltersExternal] =
    useState<FiltersState>([])

  const tstFilters = useMemo(
    () => createTSTFilters(columnFiltersExternal),
    [columnFiltersExternal],
  )

  // const [columnFiltersNuqs, setColumnFiltersNuqs] = useQueryState<FiltersState>(
  //   'filters',
  //   parseAsJson(filtersSchema.parse).withDefault([]),
  // )

  // const filtersState =
  //   config.state === 'external'
  //     ? [columnFiltersExternal, setColumnFiltersExternal]
  //     : config.state === 'nuqs'
  //       ? [columnFiltersNuqs, setColumnFiltersNuqs]
  //       : undefined

  // console.log('[DataTableDemo] re-rendering')
  const tstColumns = useMemo(() => {
    console.log('[DataTableDemo] Creating TST columns')
    return createTSTColumns({
      columns: tableColumns as ColumnDef<Issue>[],
      configs: columnsConfig,
    })
  }, [])

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

  const { filters, columns, actions } = useDataTableFilters(
    ISSUES,
    columnsConfig,
    [columnFiltersExternal, setColumnFiltersExternal],
  )

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2">
        <DataTable
          table={table}
          filters={filters}
          columns={columns}
          actions={actions}
        />
      </div>
      <div className="flex flex-col gap-3">
        {/* <div>Query: {searchParams.get('filters')}</div> */}
        <Select
          value={config.state}
          onValueChange={(value: DemoConfig['state']) =>
            setConfig({ state: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filters state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">React State</SelectItem>
            <SelectItem value="nuqs">URL Query</SelectItem>
          </SelectContent>
        </Select>
        <CodeBlock lang="json" code={print(filters)} />
      </div>
    </div>
  )
}
