'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PropertyFilterOperatorController } from '@/registry/data-table-filter/components/property-filter-operator'
import { PropertyFilterSubject } from '@/registry/data-table-filter/components/property-filter-subject'
import { PropertyFilterValueController } from '@/registry/data-table-filter/components/property-filter-value'
import type { FilterValue } from '@/registry/data-table-filter/lib/filters'
import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

export function PropertyFilterList<TData>({ table }: { table: Table<TData> }) {
  const filters = table.getState().columnFilters

  function deleteFilter(columnId: string) {
    table.getColumn(columnId)?.setFilterValue(undefined)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {filters.map((filter) => {
        const { id } = filter

        const column = table.getColumn(id)
        const meta = column!.columnDef.meta!

        const { value } = filter as { value: FilterValue<typeof meta.type> }

        if (!value) return null

        return (
          <div
            key={`filter-${id}`}
            className="flex h-7 items-center rounded-2xl border border-slate-300 bg-background"
          >
            <PropertyFilterSubject meta={meta} />
            <Separator orientation="vertical" className="bg-slate-200" />
            <PropertyFilterOperatorController
              id={id}
              table={table}
              filter={value}
            />

            <Separator orientation="vertical" />
            <PropertyFilterValueController id={id} table={table} />
            <Separator orientation="vertical" />
            <Button
              variant="ghost"
              className="m-0 h-full w-full rounded-none rounded-r-2xl p-0 px-2 text-xs"
              onClick={() => deleteFilter(id)}
            >
              <X className="size-4 -translate-x-0.5" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
