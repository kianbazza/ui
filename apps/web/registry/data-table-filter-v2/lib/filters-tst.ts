import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import { isAnyOf } from './array'
import { __multiOptionFilterFn, __optionFilterFn, filterFn } from './filter-fns'
import { isColumnOption, isColumnOptionArray, isStringArray } from './filters'
import type {
  Column,
  ColumnConfig,
  FilterModel,
  FiltersState,
} from './filters.types'

interface CreateTSTColumns<TData> {
  columns: ColumnDef<TData, any>[]
  configs: Column<TData>[]
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
