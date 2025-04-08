import type {
  Column,
  ColumnConfig,
  ColumnConfigHelper,
  ColumnDataType,
  ColumnOption,
  ElementType,
  Nullable,
} from '@/registry/data-table-filter-v2/core/types'
import { isAnyOf, uniq } from '@/registry/data-table-filter-v2/lib/array'
import { memo } from '@/registry/data-table-filter-v2/lib/memo'

export function createColumnConfigHelper<TData>(): ColumnConfigHelper<TData> {
  return {
    accessor: (accessor, config) =>
      ({
        ...config,
        accessor,
      }) as any,
  }
}

export function getColumnOptions<TData, TType extends ColumnDataType, TVal>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
): ColumnOption[] {
  if (!isAnyOf(column.type, ['option', 'multiOption'])) {
    console.warn(
      'Column options can only be retrieved for option and multiOption columns',
    )
    return []
  }

  if (column.options) {
    return column.options
  }

  const filtered = data
    .flatMap(column.accessor)
    .filter((v): v is NonNullable<TVal> => v !== undefined && v !== null)

  // console.log(`[getColumnOptions] [${column.id}] filtered:`, filtered)

  let models = uniq(filtered)

  if (column.orderFn) {
    models = models.sort((m1, m2) =>
      column.orderFn!(
        m1 as ElementType<NonNullable<TVal>>,
        m2 as ElementType<NonNullable<TVal>>,
      ),
    )
  }

  // console.log(`[getColumnOptions] [${column.id}] models:`, models)

  if (column.transformOptionFn) {
    // Memoize transformOptionFn calls
    const memoizedTransform = memo(
      () => [models],
      (deps) =>
        deps[0].map((m) =>
          column.transformOptionFn!(m as ElementType<NonNullable<TVal>>),
        ),
      { key: `transform-${column.id}` },
    )
    return memoizedTransform()
  }

  if (isColumnOptionArray(models)) return models

  throw new Error(
    `[data-table-filter] [${column.id}] Either provide static options, a transformOptionFn, or ensure the column data conforms to ColumnOption type`,
  )
}

export function getColumnValues<TData, TType extends ColumnDataType, TVal>(
  column: ColumnConfig<TData, TType, TVal>,
  data: TData[],
) {
  // Memoize accessor calls
  const memoizedAccessor = memo(
    () => [data],
    (deps) =>
      deps[0]
        .flatMap(column.accessor)
        .filter(
          (v): v is NonNullable<TVal> => v !== undefined && v !== null,
        ) as ElementType<NonNullable<TVal>>[],
    { key: `accessor-${column.id}` },
  )

  const raw = memoizedAccessor()

  if (!isAnyOf(column.type, ['option', 'multiOption'])) {
    return raw
  }

  if (column.options) {
    return raw
      .map((v) => column.options?.find((o) => o.value === v)?.value)
      .filter((v) => v !== undefined && v !== null)
  }

  if (column.transformOptionFn) {
    const memoizedTransform = memo(
      () => [raw],
      (deps) =>
        deps[0].map(
          (v) => column.transformOptionFn!(v) as ElementType<NonNullable<TVal>>,
        ),
      { key: `transform-values-${column.id}` },
    )
    return memoizedTransform()
  }

  if (isColumnOptionArray(raw)) {
    return raw
  }

  throw new Error(
    `[data-table-filter] [${column.id}] Either provide static options, a transformOptionFn, or ensure the column data conforms to ColumnOption type`,
  )
}

export function getFacetedUniqueValues<
  TData,
  TType extends ColumnDataType,
  TVal,
>(
  column: ColumnConfig<TData, TType, TVal>,
  values: string[] | ColumnOption[],
): Map<string, number> {
  // console.time('getFacetedUniqueValues')
  if (!isAnyOf(column.type, ['option', 'multiOption'])) {
    // console.timeEnd('getFacetedUniqueValues')
    // console.warn(
    //   'Faceted unique values can only be retrieved for option and multiOption columns',
    // )
    return new Map<string, number>()
  }

  const acc = new Map<string, number>()

  if (isColumnOptionArray(values)) {
    for (const option of values) {
      const curr = acc.get(option.value) ?? 0
      acc.set(option.value, curr + 1)
    }
  } else {
    for (const option of values) {
      const curr = acc.get(option as string) ?? 0
      acc.set(option as string, curr + 1)
    }
  }

  // console.timeEnd('getFacetedUniqueValues')

  return acc
}

export function getFacetedMinMaxValues<
  TData,
  TType extends ColumnDataType,
  TVal,
>(column: ColumnConfig<TData, TType, TVal>, data: TData[]): number[] {
  if (column.type !== 'number') return [0, 0] // Only applicable to number columns

  const values = data
    .flatMap((row) => column.accessor(row) as Nullable<number>)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))

  if (values.length === 0) {
    return [column.min ?? 0, column.max ?? 100] // Fallback to config or reasonable defaults
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  // Apply config overrides if provided
  return [
    column.min !== undefined ? Math.max(min, column.min) : min,
    column.max !== undefined ? Math.min(max, column.max) : max,
  ]
}

export function createColumns<TData>(
  data: TData[],
  columnConfigs: ColumnConfig<TData>[],
): Column<TData>[] {
  return columnConfigs.map((columnConfig) => {
    const getOptions: () => ColumnOption[] = memo(
      () => [data],
      () => getColumnOptions(columnConfig, data),
      { key: `options-${columnConfig.id}` },
    )

    const getValues: () => ElementType<NonNullable<any>>[] = memo(
      () => [data],
      () => getColumnValues(columnConfig, data),
      { key: `values-${columnConfig.id}` },
    )

    const getUniqueValues: () => Map<string, number> = memo(
      () => [getValues()],
      (deps) => getFacetedUniqueValues(columnConfig, deps[0]),
      { key: `faceted-${columnConfig.id}` },
    )

    const getMinMaxValues: () => number[] = memo(
      () => [data],
      () => getFacetedMinMaxValues(columnConfig, data),
      { key: `minmax-${columnConfig.id}` },
    )

    // Create the Column instance
    const column: Column<TData> = {
      ...columnConfig,
      getOptions,
      getValues,
      getFacetedUniqueValues: getUniqueValues,
      getFacetedMinMaxValues: getMinMaxValues,
      // Prefetch methods will be added below
      prefetchOptions: async () => {}, // Placeholder, defined below
      prefetchValues: async () => {},
      prefetchFacetedUniqueValues: async () => {},
      _prefetchedOptionsCache: null, // Initialize private cache
      _prefetchedValuesCache: null,
      _prefetchedFacetedCache: null,
    }

    // Define prefetch methods with access to the column instance
    column.prefetchOptions = async (): Promise<void> => {
      if (!column._prefetchedOptionsCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const options = getOptions()
            column._prefetchedOptionsCache = options
            // console.log(`Prefetched options for ${columnConfig.id}`)
            resolve(undefined)
          }, 0),
        )
      }
    }

    column.prefetchValues = async (): Promise<void> => {
      if (!column._prefetchedValuesCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const values = getValues()
            column._prefetchedValuesCache = values
            // console.log(`Prefetched values for ${columnConfig.id}`)
            resolve(undefined)
          }, 0),
        )
      }
    }

    column.prefetchFacetedUniqueValues = async (): Promise<void> => {
      if (!column._prefetchedFacetedCache) {
        await new Promise((resolve) =>
          setTimeout(() => {
            const facetedMap = getUniqueValues()
            column._prefetchedFacetedCache = facetedMap
            // console.log(
            //   `Prefetched faceted unique values for ${columnConfig.id}`,
            // )
            resolve(undefined)
          }, 0),
        )
      }
    }

    return column
  })
}

export function getColumn<TData>(columns: Column<TData>[], id: string) {
  const column = columns.find((c) => c.id === id)

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  return column
}

export function createNumberFilterValue(
  values: number[] | undefined,
): number[] {
  if (!values || values.length === 0) return []
  if (values.length === 1) return [values[0]]
  if (values.length === 2) return createNumberRange(values)
  return [values[0], values[1]]
}

export function createNumberRange(values: number[] | undefined) {
  let a = 0
  let b = 0

  if (!values || values.length === 0) return [a, b]
  if (values.length === 1) {
    a = values[0]
  } else {
    a = values[0]
    b = values[1]
  }

  const [min, max] = a < b ? [a, b] : [b, a]

  return [min, max]
}

export function isColumnOption(value: unknown): value is ColumnOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'label' in value
  )
}

export function isColumnOptionArray(value: unknown): value is ColumnOption[] {
  return Array.isArray(value) && value.every(isColumnOption)
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}
