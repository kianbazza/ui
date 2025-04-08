import {
  isColumnOption,
  isColumnOptionArray,
  isStringArray,
} from '@/registry/data-table-filter-v2/core/filters'
import type {
  ColumnConfig,
  FilterModel,
  FiltersState,
} from '@/registry/data-table-filter-v2/core/types'
import { isAnyOf } from '@/registry/data-table-filter-v2/lib/array'
import {
  __multiOptionFilterFn,
  __optionFilterFn,
  filterFn,
} from '@/registry/data-table-filter-v2/lib/filter-fns'
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'

interface CreateTSTColumns<TData> {
  columns: ColumnDef<TData>[]
  configs: ColumnConfig<TData>[]
}

export function createTSTColumns<TData>({
  columns,
  configs,
}: CreateTSTColumns<TData>) {
  const _cols: ColumnDef<TData>[] = []

  for (const col of columns) {
    // Get the column filter config for this column
    const config = configs.find((c) => c.id === col.id)

    // If the column is not filterable or doesn't have a filter config, skip it
    if (!col.enableColumnFilter || !config) {
      _cols.push(col)
      continue
    }

    if (isAnyOf(config.type, ['text', 'number', 'date'])) {
      col.filterFn = filterFn(config.type)
      _cols.push(col)
      continue
    }

    if (config.type === 'option') {
      col.filterFn = (row, columnId, filterValue: FilterModel<'option'>) => {
        const value = row.getValue(columnId)

        if (!value) return false

        if (typeof value === 'string') {
          return __optionFilterFn(value, filterValue)
        }

        if (isColumnOption(value)) {
          return __optionFilterFn(value.value, filterValue)
        }

        const sanitizedValue = config.transformOptionFn!(value as never)
        return __optionFilterFn(sanitizedValue.value, filterValue)
      }
    }

    if (config.type === 'multiOption') {
      col.filterFn = (
        row,
        columnId,
        filterValue: FilterModel<'multiOption'>,
      ) => {
        const value = row.getValue(columnId)

        if (!value) return false

        if (isStringArray(value)) {
          return __multiOptionFilterFn(value, filterValue)
        }

        if (isColumnOptionArray(value)) {
          return __multiOptionFilterFn(
            value.map((v) => v.value),
            filterValue,
          )
        }

        const sanitizedValue = (value as never[]).map((v) =>
          config.transformOptionFn!(v),
        )

        return __multiOptionFilterFn(
          sanitizedValue.map((v) => v.value),
          filterValue,
        )
      }
    }

    _cols.push(col)
  }

  return _cols
}

export function createTSTFilters(filters: FiltersState): ColumnFiltersState {
  return filters.map((filter) => ({ id: filter.columnId, value: filter }))
}
