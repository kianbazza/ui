import { isAnyOf, uniq } from './array'
import type {
  Column,
  ColumnConfig,
  ColumnConfigHelper,
  ColumnDataNativeMap,
  ColumnDataType,
  ColumnOption,
  ElementType,
  FilterDetails,
  FilterOperatorTarget,
  FilterOperators,
  FilterTypeOperatorDetails,
  FilterValues,
  Nullable,
} from './filters.types'
import { memo } from './memo'

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

export const DEFAULT_OPERATORS: Record<
  ColumnDataType,
  Record<FilterOperatorTarget, FilterOperators[ColumnDataType]>
> = {
  text: {
    single: 'contains',
    multiple: 'contains',
  },
  number: {
    single: 'is',
    multiple: 'is between',
  },
  date: {
    single: 'is',
    multiple: 'is between',
  },
  option: {
    single: 'is',
    multiple: 'is any of',
  },
  multiOption: {
    single: 'include',
    multiple: 'include any of',
  },
}

/* Details for all the filter operators for option data type */
export const optionFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is any of',
    relativeOf: 'is not',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is none of',
    relativeOf: 'is',
    isNegated: true,
    negationOf: 'is',
  },
  'is any of': {
    label: 'is any of',
    value: 'is any of',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is none of',
    isNegated: false,
    negation: 'is none of',
  },
  'is none of': {
    label: 'is none of',
    value: 'is none of',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is any of',
    isNegated: true,
    negationOf: 'is any of',
  },
} as const satisfies FilterDetails<'option'>

/* Details for all the filter operators for multi-option data type */
export const multiOptionFilterDetails = {
  include: {
    label: 'include',
    value: 'include',
    target: 'single',
    singularOf: 'include any of',
    relativeOf: 'exclude',
    isNegated: false,
    negation: 'exclude',
  },
  exclude: {
    label: 'exclude',
    value: 'exclude',
    target: 'single',
    singularOf: 'exclude if any of',
    relativeOf: 'include',
    isNegated: true,
    negationOf: 'include',
  },
  'include any of': {
    label: 'include any of',
    value: 'include any of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['exclude if all', 'include all of', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if all',
  },
  'exclude if all': {
    label: 'exclude if all',
    value: 'exclude if all',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'include all of', 'exclude if any of'],
    isNegated: true,
    negationOf: 'include any of',
  },
  'include all of': {
    label: 'include all of',
    value: 'include all of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['include any of', 'exclude if all', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if any of',
  },
  'exclude if any of': {
    label: 'exclude if any of',
    value: 'exclude if any of',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'exclude if all', 'include all of'],
    isNegated: true,
    negationOf: 'include all of',
  },
} as const satisfies FilterDetails<'multiOption'>

/* Details for all the filter operators for date data type */
export const dateFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: 'is after',
    isNegated: false,
    negation: 'is before',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: [
      'is',
      'is before',
      'is on or after',
      'is after',
      'is on or before',
    ],
    isNegated: true,
    negationOf: 'is',
  },
  'is before': {
    label: 'is before',
    value: 'is before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is on or after',
      'is after',
      'is on or before',
    ],
    isNegated: false,
    negation: 'is on or after',
  },
  'is on or after': {
    label: 'is on or after',
    value: 'is on or after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is before', 'is after', 'is on or before'],
    isNegated: false,
    negation: 'is before',
  },
  'is after': {
    label: 'is after',
    value: 'is after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is before',
      'is on or after',
      'is on or before',
    ],
    isNegated: false,
    negation: 'is on or before',
  },
  'is on or before': {
    label: 'is on or before',
    value: 'is on or before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is after', 'is on or after', 'is before'],
    isNegated: false,
    negation: 'is after',
  },
  'is between': {
    label: 'is between',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'date'>

/* Details for all the filter operators for text data type */
export const textFilterDetails = {
  contains: {
    label: 'contains',
    value: 'contains',
    target: 'single',
    relativeOf: 'does not contain',
    isNegated: false,
    negation: 'does not contain',
  },
  'does not contain': {
    label: 'does not contain',
    value: 'does not contain',
    target: 'single',
    relativeOf: 'contains',
    isNegated: true,
    negationOf: 'contains',
  },
} as const satisfies FilterDetails<'text'>

/* Details for all the filter operators for number data type */
export const numberFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: [
      'is',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: true,
    negationOf: 'is',
  },
  'is greater than': {
    label: '>',
    value: 'is greater than',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is greater than or equal to': {
    label: '>=',
    value: 'is greater than or equal to',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is less than': {
    label: '<',
    value: 'is less than',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than',
  },
  'is less than or equal to': {
    label: '<=',
    value: 'is less than or equal to',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than or equal to',
  },
  'is between': {
    label: 'is between',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'number'>

export const filterTypeOperatorDetails: FilterTypeOperatorDetails = {
  text: textFilterDetails,
  number: numberFilterDetails,
  date: dateFilterDetails,
  option: optionFilterDetails,
  multiOption: multiOptionFilterDetails,
}

/*
 *
 * Determines the new operator for a filter based on the current operator, old and new filter values.
 *
 * This handles cases where the filter values have transitioned from a single value to multiple values (or vice versa),
 * and the current operator needs to be transitioned to its plural form (or singular form).
 *
 * For example, if the current operator is 'is', and the new filter values have a length of 2, the
 * new operator would be 'is any of'.
 *
 */
export function determineNewOperator<TType extends ColumnDataType>(
  type: TType,
  oldVals: FilterValues<TType>,
  nextVals: FilterValues<TType>,
  currentOperator: FilterOperators[TType],
): FilterOperators[TType] {
  const a =
    Array.isArray(oldVals) && Array.isArray(oldVals[0])
      ? oldVals[0].length
      : oldVals.length
  const b =
    Array.isArray(nextVals) && Array.isArray(nextVals[0])
      ? nextVals[0].length
      : nextVals.length

  // console.log('[determineNewOperator] a:', a, 'b:', b)

  // If filter size has not transitioned from single to multiple (or vice versa)
  // or is unchanged, return the current operator.
  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1))
    return currentOperator

  const opDetails = filterTypeOperatorDetails[type][currentOperator]

  // Handle transition from single to multiple filter values.
  if (a < b && b >= 2) return opDetails.singularOf ?? currentOperator
  // Handle transition from multiple to single filter values.
  if (a > b && b <= 1) return opDetails.pluralOf ?? currentOperator
  return currentOperator
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
