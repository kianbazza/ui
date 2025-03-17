'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PropertyFilterOperatorController } from '@/registry/data-table-filter/components/property-filter-operator'
import { PropertyFilterSubject } from '@/registry/data-table-filter/components/property-filter-subject'
import { PropertyFilterValueController } from '@/registry/data-table-filter/components/property-filter-value'
import type {
  ColumnDataType,
  FilterValue,
} from '@/registry/data-table-filter/lib/filters'
import type { Column, ColumnMeta, Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { getColumn, getColumnMeta } from '../lib/table'

export function PropertyFilterList<TData>({ table }: { table: Table<TData> }) {
  const filters = table.getState().columnFilters

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {filters.map((filter) => {
        const { id } = filter

        const column = getColumn(table, id)
        const meta = getColumnMeta(table, id)

        // Skip if no filter value
        if (!filter.value) return null

        // Narrow the type based on meta.type and cast filter accordingly
        switch (meta.type) {
          case 'text':
            return renderFilter<TData, 'text'>(
              filter as { id: string; value: FilterValue<'text', TData> },
              column,
              meta as ColumnMeta<TData, unknown> & { type: 'text' },
              table,
            )
          case 'number':
            return renderFilter<TData, 'number'>(
              filter as { id: string; value: FilterValue<'number', TData> },
              column,
              meta as ColumnMeta<TData, unknown> & { type: 'number' },
              table,
            )
          case 'date':
            return renderFilter<TData, 'date'>(
              filter as { id: string; value: FilterValue<'date', TData> },
              column,
              meta as ColumnMeta<TData, unknown> & { type: 'date' },
              table,
            )
          case 'option':
            return renderFilter<TData, 'option'>(
              filter as { id: string; value: FilterValue<'option', TData> },
              column,
              meta as ColumnMeta<TData, unknown> & { type: 'option' },
              table,
            )
          case 'multiOption':
            return renderFilter<TData, 'multiOption'>(
              filter as {
                id: string
                value: FilterValue<'multiOption', TData>
              },
              column,
              meta as ColumnMeta<TData, unknown> & {
                type: 'multiOption'
              },
              table,
            )
          default:
            return null // Handle unknown types gracefully
        }
      })}
    </div>
  )
}

// Generic render function for a filter with type-safe value
function renderFilter<TData, T extends ColumnDataType>(
  filter: { id: string; value: FilterValue<T, TData> },
  column: Column<TData, unknown>,
  meta: ColumnMeta<TData, unknown> & { type: T },
  table: Table<TData>,
) {
  const { value } = filter

  return (
    <div
      key={`filter-${filter.id}`}
      className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs"
    >
      <PropertyFilterSubject meta={meta} />
      <Separator orientation="vertical" />
      <PropertyFilterOperatorController
        column={column}
        columnMeta={meta}
        filter={value} // Typed as FilterValue<T>
      />
      <Separator orientation="vertical" />
      <PropertyFilterValueController
        id={filter.id}
        column={column}
        columnMeta={meta}
        table={table}
      />
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        className="rounded-none rounded-r-2xl text-xs w-7 h-full"
        onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
      >
        <X className="size-4 -translate-x-0.5" />
      </Button>
    </div>
  )
}
