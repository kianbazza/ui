import {
  createColumns,
  createNumberFilterValue,
} from '@/registry/data-table-filter-v2/core/filters'
import {
  DEFAULT_OPERATORS,
  determineNewOperator,
} from '@/registry/data-table-filter-v2/core/operators'
import type {
  ColumnConfig,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FiltersState,
  OptionBasedColumnDataType,
} from '@/registry/data-table-filter-v2/core/types'
import { addUniq, removeUniq } from '@/registry/data-table-filter-v2/lib/array'
import { uniq } from '@/registry/data-table-filter/lib/array'
import { useEffect, useMemo, useState } from 'react'

export function useDataTableFilters<TData>(
  data: TData[],
  columnsConfig: ColumnConfig<TData>[],
  controlledState?:
    | [FiltersState, React.Dispatch<React.SetStateAction<FiltersState>>]
    | undefined,
) {
  const [internalFilters, setInternalFilters] = useState<FiltersState>([])
  const [filters, setFilters] = controlledState ?? [
    internalFilters,
    setInternalFilters,
  ]

  // This useMemo call ensures that createColumns() only recomputes when data or config.columns change.
  const columns = useMemo(() => {
    console.log('[useDataTableFilters] Computing columns')
    return createColumns(data, columnsConfig)
  }, [data, columnsConfig])

  const actions: DataTableFilterActions = useMemo(
    () => ({
      addFilterValue<TData, TType extends OptionBasedColumnDataType>(
        column: ColumnConfig<TData, TType>,
        values: FilterModel<TType>['values'],
      ) {
        if (column.type === 'option') {
          setFilters((prev) => {
            // Does column already have a filter?
            const filter = prev.find((f) => f.columnId === column.id) // as FilterModel<'option'> | undefined

            const isColumnFiltered = filter && filter.values.length > 0
            if (!isColumnFiltered) {
              // Add a new filter
              return [
                ...prev,
                {
                  columnId: column.id,
                  operator:
                    values.length > 1
                      ? DEFAULT_OPERATORS[column.type].multiple
                      : DEFAULT_OPERATORS[column.type].single,
                  values,
                },
              ]
            }

            // Column already has a filter - update it
            const oldValues = filter.values
            const newValues = addUniq(filter.values, values)
            const newOperator = determineNewOperator(
              'option',
              oldValues,
              newValues,
              filter.operator,
            )

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }

        if (column.type === 'multiOption') {
          setFilters((prev) => {
            // Does column already have a filter?
            const filter = prev.find((f) => f.columnId === column.id) // as FilterModel<'multiOption'> | undefined

            const isColumnFiltered = filter && filter.values.length > 0
            if (!isColumnFiltered) {
              // Add a new filter
              return [
                ...prev,
                {
                  columnId: column.id,
                  operator:
                    values.length > 1
                      ? DEFAULT_OPERATORS[column.type].multiple
                      : DEFAULT_OPERATORS[column.type].single,
                  values,
                },
              ]
            }

            // Column already has a filter - update it
            const oldValues = filter.values
            const newValues = addUniq(filter.values, values)
            const newOperator = determineNewOperator(
              'multiOption',
              oldValues,
              newValues,
              filter.operator,
            )

            // Remove filter if it's empty now
            if (newValues.length === 0) {
              return prev.filter((f) => f.columnId !== column.id)
            }

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }

        throw new Error(
          '[data-table-filter] addFilterValue() is only supported for option columns',
        )
      },
      removeFilterValue<TData, TType extends OptionBasedColumnDataType>(
        column: ColumnConfig<TData, TType>,
        value: FilterModel<TType>['values'],
      ) {
        if (column.type === 'option') {
          setFilters((prev) => {
            // Does column already have a filter?
            const filter = prev.find((f) => f.columnId === column.id) // as FilterModel<'option'> | undefined

            const isColumnFiltered = filter && filter.values.length > 0
            if (!isColumnFiltered) {
              // Add a new filter
              return [...prev]
            }

            // Column already has a filter - update it
            const newValues = removeUniq(filter.values, value)
            const oldValues = filter.values

            const newOperator = determineNewOperator(
              'option',
              oldValues,
              newValues,
              filter.operator,
            )

            // Remove filter if it's empty now
            if (newValues.length === 0) {
              return prev.filter((f) => f.columnId !== column.id)
            }

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }

        if (column.type === 'multiOption') {
          setFilters((prev) => {
            // Does column already have a filter?
            const filter = prev.find((f) => f.columnId === column.id) // as FilterModel<'multiOption'> | undefined

            const isColumnFiltered = filter && filter.values.length > 0
            if (!isColumnFiltered) {
              // Do nothing if column is not filtered
              return [...prev]
            }

            // Column already has a filter - update it
            const newValues = removeUniq(filter.values, value)
            const oldValues = filter.values

            const newOperator = determineNewOperator(
              'multiOption',
              oldValues,
              newValues,
              filter.operator,
            )

            // Remove filter if it's empty now
            if (newValues.length === 0) {
              return prev.filter((f) => f.columnId !== column.id)
            }

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }

        throw new Error(
          '[data-table-filter] removeFilterValue() is only supported for option columns',
        )
      },

      setFilterValue<TData, TType extends ColumnDataType>(
        column: ColumnConfig<TData, TType>,
        values: FilterModel<TType>['values'],
      ) {
        console.log('here!')
        setFilters((prev) => {
          // Does this column already have a filter?
          const filter = prev.find((f) => f.columnId === column.id)
          const isColumnFiltered = filter && filter.values.length > 0

          const newValues =
            column.type === 'number'
              ? createNumberFilterValue(values as number[])
              : uniq(values)

          if (newValues.length === 0) return prev

          if (!isColumnFiltered) {
            // Add a new filter
            return [
              ...prev,
              {
                columnId: column.id,
                operator:
                  values.length > 1
                    ? DEFAULT_OPERATORS[column.type].multiple
                    : DEFAULT_OPERATORS[column.type].single,
                values: newValues,
              },
            ]
          }

          // Column already has a filter - override it
          const oldValues = filter.values
          const newOperator = determineNewOperator(
            column.type,
            oldValues,
            newValues,
            filter.operator,
          )

          const newFilter = {
            columnId: column.id,
            operator: newOperator,
            values: newValues as any,
          } satisfies FilterModel<TType>

          return prev.map((f) => (f.columnId === column.id ? newFilter : f))
        })
      },
      setFilterOperator<TType extends ColumnDataType>(
        columnId: string,
        operator: FilterModel<TType>['operator'],
      ) {
        setFilters((prev) =>
          prev.map((f) => (f.columnId === columnId ? { ...f, operator } : f)),
        )
      },
      removeFilter(columnId: string) {
        setFilters((prev) => prev.filter((f) => f.columnId !== columnId))
      },
      removeAllFilters() {
        setFilters([])
      },
    }),
    [setFilters],
  )

  return { columns, filters, actions }
}
