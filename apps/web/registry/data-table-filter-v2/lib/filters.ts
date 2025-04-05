import type { LucideIcon } from 'lucide-react'

export type ElementType<T> = T extends (infer U)[] ? U : T

export interface DataTableFilterActions {
  setFilterValue: <TType extends ColumnDataType>(
    columnId: string,
    values: FilterModel<TType>['values'],
  ) => void

  setFilterOperator: <TType extends ColumnDataType>(
    columnId: string,
    operator: FilterModel<TType>['operator'],
  ) => void

  removeFilter: (columnId: string) => void

  removeAllFilters: () => void
}

export type TAccessorFn<TData, TVal = unknown> = (data: TData) => TVal

export type ColumnConfig<TData, TVal = unknown> = {
  id: string
  accessor: TAccessorFn<TData, TVal>
  displayName: string
  icon: LucideIcon
  type: ColumnDataType
  options?: ColumnOption[]
  max?: number
  // transformOptionFn?: (value: NonNullable<ElementType<TVal>>) => ColumnOption
}

export type ColumnConfigHelper<TData> = {
  accessor: <
    TAccessor extends TAccessorFn<TData>,
    TVal extends ReturnType<TAccessor>,
  >(
    accessor: TAccessor,
    config?: Omit<ColumnConfig<TData, TVal>, 'accessor'>,
  ) => ColumnConfig<TData, TVal>
}

export function createColumnConfigHelper<TData>(): ColumnConfigHelper<TData> {
  return {
    accessor: (accessor, config) =>
      ({
        ...config,
        accessor,
      }) as any,
  }
}

export type DataTableFilterConfig<TData> = {
  data: TData[]
  columns: ColumnConfig<TData>[]
}

export type ColumnProperties<TData, TVal> = {
  getOptions: () => ColumnOption[]
  getFacetedUniqueValues: () => Map<string, number>
  getFacetedMinMaxValues: () => number[]
}

export function getColumnOptions<TData, TVal>(
  column: ColumnConfig<TData, TVal>,
  data: TData[],
): ColumnOption[] {
  if (column.options) return column.options
  return data.map(column.accessor) as ColumnOption[]
}

export function getFacetedUniqueValues<TData, TVal>(
  column: ColumnConfig<TData, TVal>,
  data: TData[],
): Map<string, number> {
  return new Map<string, number>()
}

export function getFacetedMinMaxValues<TData, TVal>(
  column: ColumnConfig<TData, TVal>,
  data: TData[],
): number[] {
  return [0, 0]
}

export type Column<TData, TVal = unknown> = ColumnConfig<TData, TVal> &
  ColumnProperties<TData, TVal>

export function createColumns<TData>(
  data: TData[],
  columnConfigs: ColumnConfig<TData>[],
): Column<TData>[] {
  const columns: Column<TData>[] = []

  for (const columnConfig of columnConfigs) {
    const column: Column<TData> = {
      ...columnConfig,
      getOptions: () => getColumnOptions(columnConfig, data),
      getFacetedUniqueValues: () => getFacetedUniqueValues(columnConfig, data),
      getFacetedMinMaxValues: () => getFacetedMinMaxValues(columnConfig, data),
    }
    columns.push(column)
  }

  return columns
}

export function getColumn<TData>(columns: Column<TData>[], id: string) {
  const column = columns.find((c) => c.id === id)

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  return column
}

/*
 * Represents a possible value for a column property of type 'option' or 'multiOption'.
 */
export interface ColumnOption {
  /* The label to display for the option. */
  label: string
  /* The internal value of the option. */
  value: string
  /* An optional icon to display next to the label. */
  icon?: React.ReactElement | React.ElementType
}

/*
 * Represents the data type of a column.
 */
export type ColumnDataType =
  /* The column value is a string that should be searchable. */
  | 'text'
  | 'number'
  | 'date'
  /* The column value can be a single value from a list of options. */
  | 'option'
  /* The column value can be zero or more values from a list of options. */
  | 'multiOption'

/* Operators for text data */
export type TextFilterOperator = 'contains' | 'does not contain'

/* Operators for number data */
export type NumberFilterOperator =
  | 'is'
  | 'is not'
  | 'is less than'
  | 'is greater than or equal to'
  | 'is greater than'
  | 'is less than or equal to'
  | 'is between'
  | 'is not between'

/* Operators for date data */
export type DateFilterOperator =
  | 'is'
  | 'is not'
  | 'is before'
  | 'is on or after'
  | 'is after'
  | 'is on or before'
  | 'is between'
  | 'is not between'

/* Operators for option data */
export type OptionFilterOperator = 'is' | 'is not' | 'is any of' | 'is none of'

/* Operators for multi-option data */
export type MultiOptionFilterOperator =
  | 'include'
  | 'exclude'
  | 'include any of'
  | 'include all of'
  | 'exclude if any of'
  | 'exclude if all'

/* Maps filter operators to their respective data types */
export type FilterOperators = {
  text: TextFilterOperator
  number: NumberFilterOperator
  date: DateFilterOperator
  option: OptionFilterOperator
  multiOption: MultiOptionFilterOperator
}

/* Maps filter values to their respective data types */
export type FilterTypes = {
  text: string
  number: number
  date: Date
  option: string
  multiOption: string[]
}

/*
 *
 * FilterValue is a type that represents a filter value for a specific column.
 *
 * It consists of:
 * - Operator: The operator to be used for the filter.
 * - Values: An array of values to be used for the filter.
 *
 */
export type FilterModel<TType extends ColumnDataType> = {
  columnId: string
  operator: FilterOperators[TType]
  values: Array<FilterTypes[TType]>
}

export type FiltersState = Array<FilterModel<any>>

/*
 * FilterDetails is a type that represents the details of all the filter operators for a specific column data type.
 */
export type FilterDetails<T extends ColumnDataType> = {
  [key in FilterOperators[T]]: FilterOperatorDetails<key, T>
}

type FilterOperatorDetailsBase<OperatorValue, T extends ColumnDataType> = {
  /* The operator value. Usually the string representation of the operator. */
  value: OperatorValue
  /* The label for the operator, to show in the UI. */
  label: string
  /* How much data the operator applies to. */
  target: 'single' | 'multiple'
  /* The plural form of the operator, if applicable. */
  singularOf?: FilterOperators[T]
  /* The singular form of the operator, if applicable. */
  pluralOf?: FilterOperators[T]
  /* All related operators. Normally, all the operators which share the same target. */
  relativeOf: FilterOperators[T] | Array<FilterOperators[T]>
  /* Whether the operator is negated. */
  isNegated: boolean
  /* If the operator is not negated, this provides the negated equivalent. */
  negation?: FilterOperators[T]
  /* If the operator is negated, this provides the positive equivalent. */
  negationOf?: FilterOperators[T]
}

/*
 *
 * FilterOperatorDetails is a type that provides details about a filter operator for a specific column data type.
 * It extends FilterOperatorDetailsBase with additional logic and contraints on the defined properties.
 *
 */
export type FilterOperatorDetails<
  OperatorValue,
  T extends ColumnDataType,
> = FilterOperatorDetailsBase<OperatorValue, T> &
  (
    | { singularOf?: never; pluralOf?: never }
    | { target: 'single'; singularOf: FilterOperators[T]; pluralOf?: never }
    | { target: 'multiple'; singularOf?: never; pluralOf: FilterOperators[T] }
  ) &
  (
    | { isNegated: false; negation: FilterOperators[T]; negationOf?: never }
    | { isNegated: true; negation?: never; negationOf: FilterOperators[T] }
  )

/* Details for all the filter operators for option data type */
export const optionFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is not',
    relativeOf: 'is any of',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is',
    relativeOf: 'is none of',
    isNegated: true,
    negationOf: 'is',
  },
  'is any of': {
    label: 'is any of',
    value: 'is any of',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is',
    isNegated: false,
    negation: 'is none of',
  },
  'is none of': {
    label: 'is none of',
    value: 'is none of',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is not',
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
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'number'>

/* Maps column data types to their respective filter operator details */
type FilterTypeOperatorDetails = {
  [key in ColumnDataType]: FilterDetails<key>
}

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
export function determineNewOperator<T extends ColumnDataType>(
  type: T,
  oldVals: Array<FilterTypes[T]>,
  nextVals: Array<FilterTypes[T]>,
  currentOperator: FilterOperators[T],
): FilterOperators[T] {
  const a =
    Array.isArray(oldVals) && Array.isArray(oldVals[0])
      ? oldVals[0].length
      : oldVals.length
  const b =
    Array.isArray(nextVals) && Array.isArray(nextVals[0])
      ? nextVals[0].length
      : nextVals.length

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
