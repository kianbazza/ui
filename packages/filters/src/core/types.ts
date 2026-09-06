import type { orderFns } from '../lib/order-fns.js'

/*
 * # GENERAL NOTES:
 *
 * ## GENERICS:
 *
 * TData is the shape of a single row in your data table.
 * TVal is the shape of the underlying value for a column.
 * TType is the type (kind) of the column.
 *
 */

export type ElementType<T> = T extends (infer U)[] ? U : T

export type Nullable<T> = T | null | undefined

export type FiltersStateUpdaterFn<TContext> = (
  prev: FiltersState,
  next: FiltersState,
  context?: TContext,
) => void

/**
 * Interface for column metadata that can be extended via declaration merging.
 * Users can augment this interface to add custom metadata properties.
 *
 * @example
 * ```typescript
 * declare module '@bazzaui/filters' {
 *   interface ColumnMeta {
 *     tooltip?: string
 *     category?: string
 *     sortable?: boolean
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: consumers can override this
export interface ColumnMeta {}

/*
 * The model of a column option.
 * Used for representing underlying column values of type `option` or `multiOption`.
 */
export interface ColumnOption {
  /* The label to display for the option. */
  label: string
  /* The internal value of the option. */
  value: string
  /* An optional icon to display next to the label. */
  icon?: React.ReactElement | React.ElementType
  /* The count of this option in the data (automatically populated from faceted data). */
  count?: number
}

export interface ColumnOptionExtended extends ColumnOption {
  selected?: boolean
  count?: number
}

export type NumericValue = number | bigint

/*
 * Represents the data type (kind) of a column.
 */
export type ColumnDataType =
  /* The column value is a string that should be searchable. */
  | 'text'
  | 'number'
  | 'bigint'
  | 'date'
  | 'boolean'
  /* The column value can be a single value from a list of options. */
  | 'option'
  /* The column value can be zero or more values from a list of options. */
  | 'multiOption'

/*
 * Represents the data type (kind) of option and multi-option columns.
 */
export type OptionBasedColumnDataType = Extract<
  ColumnDataType,
  'option' | 'multiOption'
>

/*
 * Maps a ColumnDataType to it's primitive type (i.e. string, number, etc.).
 */
export type ColumnDataNativeMap = {
  text: string
  number: number
  bigint: bigint
  date: Date
  boolean: boolean
  option: string
  multiOption: string[]
}

/*
 * Represents the value of a column filter.
 * Contigent on the filtered column's data type.
 */
export type FilterValues<T extends ColumnDataType> = Array<
  ElementType<ColumnDataNativeMap[T]>
>

/*
 * An accessor function for a column's data.
 * Uses the original row data as an argument.
 */
export type TAccessorFn<TData, TVal = unknown> = (data: TData) => TVal

/*
 * Used by `option` and `multiOption` columns.
 * Transforms the underlying column value into a valid ColumnOption.
 */
export type TTransformValueToOptionFn<TVal = unknown> = (
  value: ElementType<NonNullable<TVal>>,
) => ColumnOption

export type TOrderFns = Array<TOrderFn>

export type TOrderFn = TCustomOrderFn

export type TCustomOrderFn = (a: ColumnOption, b: ColumnOption) => number

export type TBuiltInOrderFn = (
  a: ColumnOption,
  b: ColumnOption,
  direction: OrderDirection,
) => number

export type TOrderFnArg = [TBuiltInOrderFnName, OrderDirection] | TCustomOrderFn

/*
 * Used by `option` and `multiOption` columns.
 * The direction of ordering for built-in ordering functions.
 */
export type OrderDirection = 'asc' | 'desc'

export type TBuiltInOrderFnName = keyof typeof orderFns

/*
 * Used by `option` and `multiOption` columns.
 * Transforms the computed column options after initial computation, with access to faceted data.
 * Applied AFTER transformValueToOptionFn.
 */
export type TTransformOptionsFn = (options: ColumnOption[]) => ColumnOption[]

/*
 * The configuration for a column.
 */
export type ColumnConfig<
  TData,
  TType extends ColumnDataType = any,
  TVal = unknown,
  TId extends string = string,
> = {
  id: TId
  accessor: TAccessorFn<TData, TVal>
  displayName: string
  icon?: React.ReactElement | React.ElementType
  type: TType
  hidden?: boolean
  options?: TType extends OptionBasedColumnDataType ? ColumnOption[] : never
  facetedOptions?: TType extends OptionBasedColumnDataType
    ? Map<string, number>
    : never
  min?: TType extends 'number'
    ? number
    : TType extends 'bigint'
      ? bigint
      : never
  max?: TType extends 'number'
    ? number
    : TType extends 'bigint'
      ? bigint
      : never
  transformValueToOptionFn?: TType extends OptionBasedColumnDataType
    ? TTransformValueToOptionFn<TVal>
    : never
  orderFn?: TType extends OptionBasedColumnDataType ? TOrderFns : never
  transformOptionsFn?: TType extends OptionBasedColumnDataType
    ? TTransformOptionsFn
    : never
  toggledStateName?: TType extends 'boolean' ? string : never
  meta?: ColumnMeta
}

export type OptionColumnId<T> =
  T extends ColumnConfig<any, 'option' | 'multiOption', any, infer TId>
    ? TId
    : never

export type OptionColumnIds<
  T extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = {
  [K in keyof T]: OptionColumnId<T[K]>
}[number]

export type NumberColumnId<T> =
  T extends ColumnConfig<any, 'number', any, infer TId> ? TId : never

export type NumberColumnIds<
  T extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = {
  [K in keyof T]: NumberColumnId<T[K]>
}[number]

export type BigIntColumnId<T> =
  T extends ColumnConfig<any, 'bigint', any, infer TId> ? TId : never

export type BigIntColumnIds<
  T extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = {
  [K in keyof T]: BigIntColumnId<T[K]>
}[number]

/*
 * Describes a helper function for creating column configurations.
 */
export type ColumnConfigHelper<TData> = {
  accessor: <
    TAccessor extends TAccessorFn<TData>,
    TType extends ColumnDataType,
    TVal extends ReturnType<TAccessor>,
  >(
    accessor: TAccessor,
    config?: Omit<ColumnConfig<TData, TType, TVal>, 'accessor'>,
  ) => ColumnConfig<TData, TType, unknown>
}

export type DataTableFilterConfig<TData> = {
  data: TData[]
  columns: ColumnConfig<TData>[]
}

export type MinMaxReturn<T extends ColumnDataType> = T extends 'number'
  ? [number, number] | undefined
  : T extends 'bigint'
    ? [bigint, bigint] | undefined
    : undefined

export type ColumnProperties<_TData, TType extends ColumnDataType, TVal> = {
  getOptions: () => ColumnOption[]
  getValues: () => ElementType<NonNullable<TVal>>[]
  getFacetedUniqueValues: () => Map<string, number> | undefined
  getFacetedMinMaxValues: () => MinMaxReturn<TType>
  prefetchOptions: () => Promise<void> // Prefetch options
  prefetchValues: () => Promise<void> // Prefetch values
  prefetchFacetedUniqueValues: () => Promise<void> // Prefetch faceted unique values
  prefetchFacetedMinMaxValues: () => Promise<void> // Prefetch faceted min/max values
}

export type ColumnPrivateProperties<_TData, TVal> = {
  _prefetchedOptionsCache: ColumnOption[] | null
  _prefetchedValuesCache: ElementType<NonNullable<TVal>>[] | null
  _prefetchedFacetedUniqueValuesCache: Map<string, number> | null
  _prefetchedFacetedMinMaxValuesCache: [number, number] | null
}

export type Column<
  TData,
  TType extends ColumnDataType = any,
  TVal = unknown,
> = ColumnConfig<TData, TType, TVal> &
  ColumnProperties<TData, TType, TVal> &
  ColumnPrivateProperties<TData, TVal>

export interface DataTableFilterActions<TContext = any> {
  addFilterValue: <TData, TType extends OptionBasedColumnDataType>(
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
    context?: TContext,
  ) => void

  removeFilterValue: <TData, TType extends OptionBasedColumnDataType>(
    column: Column<TData, TType>,
    value: FilterModel<TType>['values'],
    context?: TContext,
  ) => void

  setFilterValue: <TData, TType extends ColumnDataType>(
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
    context?: TContext,
  ) => void

  setFilterOperator: <TType extends ColumnDataType>(
    columnId: string,
    operator: FilterModel<TType>['operator'],
    context?: TContext,
  ) => void

  removeFilter: (columnId: string, context?: TContext) => void

  removeAllFilters: (context?: TContext) => void

  batch: (
    callback: (batchActions: DataTableFilterBatchActions) => void,
    context?: TContext,
  ) => void
}

export interface FilterOperations {
  addFilterValue: <TData, TType extends OptionBasedColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ) => FiltersState

  removeFilterValue: <TData, TType extends OptionBasedColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    value: FilterModel<TType>['values'],
  ) => FiltersState

  setFilterValue: <TData, TType extends ColumnDataType>(
    filters: FiltersState,
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ) => FiltersState

  setFilterOperator: <TType extends ColumnDataType>(
    filters: FiltersState,
    columnId: string,
    operator: FilterModel<TType>['operator'],
  ) => FiltersState

  removeFilter: (filters: FiltersState, columnId: string) => FiltersState

  removeAllFilters: (filters: FiltersState) => FiltersState
}

export interface DataTableFilterBatchActions extends BatchFilterOperations {}

export interface BatchFilterOperations {
  addFilterValue: <TData, TType extends OptionBasedColumnDataType>(
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ) => void

  removeFilterValue: <TData, TType extends OptionBasedColumnDataType>(
    column: Column<TData, TType>,
    value: FilterModel<TType>['values'],
  ) => void

  setFilterValue: <TData, TType extends ColumnDataType>(
    column: Column<TData, TType>,
    values: FilterModel<TType>['values'],
  ) => void

  setFilterOperator: <TType extends ColumnDataType>(
    columnId: string,
    operator: FilterModel<TType>['operator'],
  ) => void

  removeFilter: (columnId: string) => void

  removeAllFilters: () => void
}

export type FilterStrategy = 'client' | 'server'

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

export type BigIntFilterOperator = NumberFilterOperator

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

/* Operators for boolean data */
export type BooleanFilterOperator = 'is' | 'is not'

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
  bigint: BigIntFilterOperator
  date: DateFilterOperator
  boolean: BooleanFilterOperator
  option: OptionFilterOperator
  multiOption: MultiOptionFilterOperator
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
export type FilterModel<TType extends ColumnDataType = any> = {
  columnId: string
  type: TType
  operator: FilterOperators[TType]
  values: FilterValues<TType>
}

export type FiltersState = Array<FilterModel>

/*
 * FilterDetails is a type that represents the details of all the filter operators for a specific column data type.
 */
export type FilterDetails<T extends ColumnDataType> = {
  [key in FilterOperators[T]]: FilterOperatorDetails<key, T>
}

export type FilterOperatorTarget = 'single' | 'multiple'

export type FilterOperatorDetailsBase<
  OperatorValue,
  T extends ColumnDataType,
> = {
  /* The i18n key for the operator. */
  key: string
  /* The operator value. Usually the string representation of the operator. */
  value: OperatorValue
  /* How much data the operator applies to. */
  target: FilterOperatorTarget
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

/* Maps column data types to their respective filter operator details */
export type FilterTypeOperatorDetails = {
  [key in ColumnDataType]: FilterDetails<key>
}

/**
 * Faceted data for columns - provides pre-computed aggregation data.
 * - Option/MultiOption columns: Map of value -> count
 * - Number columns: [min, max] tuple
 * - BigInt columns: [min, max] tuple
 */
export type FacetedColumnData<
  TColumns extends ReadonlyArray<ColumnConfig<any, any, any, any>>,
> = Partial<
  | Record<OptionColumnIds<TColumns>, Map<string, number> | undefined>
  | Record<NumberColumnIds<TColumns>, [number, number] | undefined>
  | Record<BigIntColumnIds<TColumns>, [bigint, bigint] | undefined>
>

export interface DataTableFiltersOptions<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
  TContext = any,
> {
  strategy: TStrategy
  data: TData[]
  columnsConfig: TColumns
  defaultFilters?: FiltersState
  filters?: FiltersState
  onFiltersChange?:
    | React.Dispatch<React.SetStateAction<FiltersState>>
    | FiltersStateUpdaterFn<TContext>
  options?: Partial<
    Record<OptionColumnIds<TColumns>, ColumnOption[] | undefined>
  >
  faceted?: FacetedColumnData<TColumns>
  entityName?: string
}

export interface DataTableFiltersInstance<
  TData,
  TStrategy extends FilterStrategy,
  TContext,
> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions<TContext>
  strategy: TStrategy
  entityName?: string
}
