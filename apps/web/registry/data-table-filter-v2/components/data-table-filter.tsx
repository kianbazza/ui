'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
// import { Checkbox as __Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  // CommandItem as __CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn, print } from '@/lib/utils'
import { format, isEqual } from 'date-fns'
import { FilterXIcon } from 'lucide-react'
import { ArrowRight, Filter } from 'lucide-react'
import { X } from 'lucide-react'
import { Ellipsis } from 'lucide-react'
import { Nullable } from 'nuqs'
import {
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { DateRange } from 'react-day-picker'
import { take, uniq } from '../lib/array'
import { addUniq, removeUniq } from '../lib/array'
import {
  DEFAULT_OPERATORS,
  createColumns,
  createNumberFilterValue,
  createNumberRange,
  dateFilterDetails,
  determineNewOperator,
  filterTypeOperatorDetails,
  getColumn,
  multiOptionFilterDetails,
  numberFilterDetails,
  optionFilterDetails,
  textFilterDetails,
} from '../lib/filters'
import type {
  Column,
  ColumnConfig,
  ColumnDataType,
  ColumnOption,
  DataTableFilterActions,
  DataTableFilterConfig,
  ElementType,
  FilterModel,
  FilterOperators,
  FilterValues,
  FiltersState,
  OptionBasedColumnDataType,
} from '../lib/filters.types'

// const Checkbox = memo(__Checkbox) as typeof __Checkbox
// const CommandItem = memo(__CommandItem) as typeof __CommandItem
// const Checkbox = __Checkbox
// const CommandItem = __CommandItem

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

  // console.log('Filters:', print(filters))

  useEffect(() => {
    console.log('[useDataTableFilters] Filters:', print(filters))
  }, [filters])

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

interface DataTableFilterProps<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
}

export function DataTableFilter<TData>({
  columns,
  filters,
  actions,
}: DataTableFilterProps<TData>) {
  // const isMobile = useIsMobile()
  // if (isMobile) {
  //   return (
  //     <div className="flex w-full items-start justify-between gap-2">
  //       <div className="flex gap-1">
  //         <FilterSelector
  //           filters={filters}
  //           columns={columns}
  //           actions={actions}
  //         />
  //         <FilterActions filters={filters} actions={actions} />
  //       </div>
  //       <ActiveFiltersMobileContainer>
  //         <ActiveFilters
  //           columns={columns}
  //           filters={filters}
  //           actions={actions}
  //         />
  //       </ActiveFiltersMobileContainer>
  //     </div>
  //   )
  // }

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex md:flex-wrap gap-2 w-full flex-1">
        <FilterSelector columns={columns} filters={filters} actions={actions} />
        <ActiveFilters columns={columns} filters={filters} actions={actions} />
      </div>
      <FilterActions hasFilters={filters.length > 0} actions={actions} />
    </div>
  )
}

interface FilterActionsProps {
  hasFilters: boolean
  actions?: DataTableFilterActions
}

export const FilterActions = memo(__FilterActions)
function __FilterActions({ hasFilters, actions }: FilterActionsProps) {
  return (
    <Button
      className={cn('h-7 !px-2', !hasFilters && 'hidden')}
      variant="destructive"
      onClick={actions?.removeAllFilters}
    >
      <FilterXIcon />
      <span className="hidden md:block">Clear</span>
    </Button>
  )
}

interface FilterSelectorProps<TData> {
  filters: FiltersState
  columns: Column<TData>[]
  actions: DataTableFilterActions
}

export const FilterSelector = memo(__FilterSelector) as typeof __FilterSelector

function __FilterSelector<TData>({
  filters,
  columns,
  actions,
}: FilterSelectorProps<TData>) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [property, setProperty] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const column = property ? getColumn(columns, property) : undefined
  const filter = property
    ? filters.find((f) => f.columnId === property)
    : undefined

  const hasFilters = filters.length > 0

  useEffect(() => {
    if (property && inputRef) {
      inputRef.current?.focus()
      setValue('')
    }
  }, [property])

  useEffect(() => {
    if (!open) setTimeout(() => setValue(''), 150)
  }, [open])

  // biome-ignore lint/correctness/useExhaustiveDependencies: need filters to be updated
  const content = useMemo(
    () =>
      property && column ? (
        <FilterValueController
          filter={filter!}
          column={column as Column<TData, ColumnDataType>}
          actions={actions}
        />
      ) : (
        <Command loop>
          <CommandInput
            value={value}
            onValueChange={setValue}
            ref={inputRef}
            placeholder="Search..."
          />
          <CommandEmpty>No results.</CommandEmpty>
          <CommandList className="max-h-fit">
            <CommandGroup>
              {columns.map((column) => (
                <FilterableColumn
                  key={column.id}
                  column={column}
                  setProperty={setProperty}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      ),
    [property, column, filter, filters, columns, actions, value],
  )

  return (
    <Popover
      open={open}
      onOpenChange={async (value) => {
        setOpen(value)
        if (!value) setTimeout(() => setProperty(undefined), 100)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-7', hasFilters && 'w-fit !px-2')}
        >
          <Filter className="size-4" />
          {!hasFilters && <span>Filter</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

export function FilterableColumn<TData, TType extends ColumnDataType, TVal>({
  column,
  setProperty,
}: {
  column: Column<TData, TType, TVal>
  setProperty: (value: string) => void
}) {
  const itemRef = useRef<HTMLDivElement>(null)

  const prefetch = useCallback(() => {
    column.prefetchOptions()
    column.prefetchValues()
    column.prefetchFacetedUniqueValues()
  }, [column])

  useEffect(() => {
    const target = itemRef.current

    if (!target) return

    // Set up MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const isSelected = target.getAttribute('data-selected') === 'true'
          if (isSelected) prefetch()
        }
      }
    })

    // Set up observer
    observer.observe(target, {
      attributes: true,
      attributeFilter: ['data-selected'],
    })

    // Cleanup on unmount
    return () => observer.disconnect()
  }, [prefetch])

  return (
    <CommandItem
      ref={itemRef}
      onSelect={() => setProperty(column.id)}
      className="group"
      onMouseEnter={prefetch}
    >
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          {<column.icon strokeWidth={2.25} className="size-4" />}
          <span>{column.displayName}</span>
        </div>
        <ArrowRight className="size-4 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  )
}

interface ActiveFiltersProps<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
}

export function ActiveFilters<TData>({
  columns,
  filters,
  actions,
}: ActiveFiltersProps<TData>) {
  return (
    <>
      {filters.map((filter) => {
        const id = filter.columnId

        const column = getColumn(columns, id)

        // Skip if no filter value
        if (!filter.values) return null

        return (
          <ActiveFilter
            key={`active-filter-${filter.columnId}`}
            filter={filter}
            column={column}
            actions={actions}
          />
        )
      })}
    </>
  )
}

interface ActiveFilterProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
}

// Generic render function for a filter with type-safe value
export function ActiveFilter<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
}: ActiveFilterProps<TData, TType>) {
  return (
    <div className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs text-xs">
      <FilterSubject column={column} />
      <Separator orientation="vertical" />
      <FilterOperator filter={filter} column={column} actions={actions} />
      <Separator orientation="vertical" />
      <FilterValue filter={filter} column={column} actions={actions} />
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        className="rounded-none rounded-r-2xl text-xs w-7 h-full"
        onClick={() => actions.removeFilter(filter.columnId)}
      >
        <X className="size-4 -translate-x-0.5" />
      </Button>
    </div>
  )
}

/****** Property Filter Subject ******/

interface FilterSubjectProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
}

export function FilterSubject<TData, TType extends ColumnDataType>({
  column,
}: FilterSubjectProps<TData, TType>) {
  const hasIcon = !!column.icon
  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
      {hasIcon && <column.icon className="size-4 stroke-[2.25px]" />}
      <span>{column.displayName}</span>
    </span>
  )
}

/****** Property Filter Operator ******/

interface FilterOperatorProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
  filter: FilterModel<TType>
  actions: DataTableFilterActions
}

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function FilterOperator<TData, TType extends ColumnDataType>({
  column,
  filter,
  actions,
}: FilterOperatorProps<TData, TType>) {
  const [open, setOpen] = useState<boolean>(false)

  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <FilterOperatorDisplay filter={filter} columnType={column.type} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <Command loop>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results.</CommandEmpty>
          <CommandList className="max-h-fit">
            <FilterOperatorController
              filter={filter}
              column={column}
              actions={actions}
              closeController={close}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface FilterOperatorDisplayProps<TType extends ColumnDataType> {
  filter: FilterModel<TType>
  columnType: TType
}

export function FilterOperatorDisplay<TType extends ColumnDataType>({
  filter,
  columnType,
}: FilterOperatorDisplayProps<TType>) {
  const operator = filterTypeOperatorDetails[columnType][filter.operator]

  return <span>{operator.label}</span>
}

interface FilterOperatorControllerProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  closeController: () => void
}

/*
 *
 * TODO: Reduce into a single component. Each data type does not need it's own controller.
 *
 */
export function FilterOperatorController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  closeController,
}: FilterOperatorControllerProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterOperatorOptionController
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          closeController={closeController}
        />
      )
    case 'multiOption':
      return (
        <FilterOperatorMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          closeController={closeController}
        />
      )
    case 'date':
      return (
        <FilterOperatorDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          closeController={closeController}
        />
      )
    case 'text':
      return (
        <FilterOperatorTextController
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          closeController={closeController}
        />
      )
    case 'number':
      return (
        <FilterOperatorNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          closeController={closeController}
        />
      )
    default:
      return null
  }
}

function FilterOperatorOptionController<TData>({
  filter,
  column,
  actions,
  closeController,
}: FilterOperatorControllerProps<TData, 'option'>) {
  const filterDetails = optionFilterDetails[filter.operator]

  // console.log(
  //   '[FilterOperatorOptionController] filterDetails:',
  //   print(filterDetails),
  // )

  const relatedFilters = Object.values(optionFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['option'])
    closeController()
  }

  return (
    <CommandGroup heading="Operators">
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.label}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorMultiOptionController<TData>({
  filter,
  column,
  actions,
  closeController,
}: FilterOperatorControllerProps<TData, 'multiOption'>) {
  const filterDetails = multiOptionFilterDetails[filter.operator]

  const relatedFilters = Object.values(multiOptionFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(
      column.id,
      value as FilterOperators['multiOption'],
    )
    closeController()
  }

  return (
    <CommandGroup heading="Operators">
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.label}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorDateController<TData>({
  filter,
  column,
  actions,
  closeController,
}: FilterOperatorControllerProps<TData, 'date'>) {
  const filterDetails = dateFilterDetails[filter.operator]

  const relatedFilters = Object.values(dateFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['date'])
    closeController()
  }

  return (
    <CommandGroup>
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.label}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

export function FilterOperatorTextController<TData>({
  filter,
  column,
  actions,
  closeController,
}: FilterOperatorControllerProps<TData, 'text'>) {
  const filterDetails = textFilterDetails[filter.operator]

  const relatedFilters = Object.values(textFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['text'])
    closeController()
  }

  return (
    <CommandGroup heading="Operators">
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.label}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorNumberController<TData>({
  filter,
  column,
  actions,
  closeController,
}: FilterOperatorControllerProps<TData, 'number'>) {
  // Show all related operators
  const filterDetails = numberFilterDetails[filter.operator]

  // console.log(
  //   '[FilterOperatorOptionController] filterDetails:',
  //   print(filterDetails),
  // )

  const relatedFilters = Object.values(numberFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['number'])
    closeController()
  }

  return (
    <div>
      <CommandGroup heading="Operators">
        {relatedFilters.map((r) => (
          <CommandItem
            onSelect={() => changeOperator(r.value)}
            value={r.value}
            key={r.value}
          >
            {r.label} {/**/}
          </CommandItem>
        ))}
      </CommandGroup>
    </div>
  )
}

/****** Property Filter Value ******/

interface FilterValueProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
}

export const FilterValue = memo(__FilterValue) as typeof __FilterValue

function __FilterValue<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
}: FilterValueProps<TData, TType>) {
  // console.log('[FilterValue] Rendering')
  useEffect(() => {
    console.log('[FilterValue] Filters:', print(filter))
  }, [filter])

  return (
    <Popover>
      <PopoverAnchor className="h-full" />
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <FilterValueDisplay
            filter={filter}
            column={column}
            actions={actions}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <FilterValueController
          filter={filter}
          column={column}
          actions={actions}
        />
      </PopoverContent>
    </Popover>
  )
}

interface FilterValueDisplayProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
}

export function FilterValueDisplay<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
}: FilterValueDisplayProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionDisplay
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionDisplay
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
        />
      )
    case 'date':
      return (
        <FilterValueDateDisplay
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
        />
      )
    case 'text':
      return (
        <FilterValueTextDisplay
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
        />
      )
    case 'number':
      return (
        <FilterValueNumberDisplay
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
        />
      )
    default:
      return null
  }
}

export function FilterValueOptionDisplay<TData>({
  filter,
  column,
  actions,
}: FilterValueDisplayProps<TData, 'option'>) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) => filter?.values.includes(o.value))

  // We display the selected options based on how many are selected
  //
  // If there is only one option selected, we display its icon and label
  //
  // If there are multiple options selected, we display:
  // 1) up to 3 icons of the selected options
  // 2) the number of selected options
  if (selected.length === 1) {
    const { label, icon: Icon } = selected[0]
    const hasIcon = !!Icon
    return (
      <span className="inline-flex items-center gap-1">
        {hasIcon &&
          (isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="size-4 text-primary" />
          ))}
        <span>{label}</span>
      </span>
    )
  }
  const name = column.displayName.toLowerCase()
  const pluralName = name.endsWith('s') ? `${name}es` : `${name}s`

  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-0.5">
      {hasOptionIcons &&
        take(selected, 3).map(({ value, icon }) => {
          const Icon = icon!
          return isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon key={value} className="size-4" />
          )
        })}
      <span className={cn(hasOptionIcons && 'ml-1.5')}>
        {selected.length} {pluralName}
      </span>
    </div>
  )
}

export function FilterValueMultiOptionDisplay<TData>({
  filter,
  column,
  actions,
}: FilterValueDisplayProps<TData, 'multiOption'>) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) => filter.values.includes(o.value))

  if (selected.length === 1) {
    const { label, icon: Icon } = selected[0]
    const hasIcon = !!Icon
    return (
      <span className="inline-flex items-center gap-1.5">
        {hasIcon &&
          (isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="size-4 text-primary" />
          ))}

        <span>{label}</span>
      </span>
    )
  }

  const name = column.displayName.toLowerCase()

  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-1.5">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {take(selected, 3).map(({ value, icon }) => {
            const Icon = icon!
            return isValidElement(Icon) ? (
              cloneElement(Icon, { key: value })
            ) : (
              <Icon key={value} className="size-4" />
            )
          })}
        </div>
      )}
      <span>
        {selected.length} {name}
      </span>
    </div>
  )
}

function formatDateRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth && sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
  }

  if (sameYear) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

export function FilterValueDateDisplay<TData>({
  filter,
  column,
  actions,
}: FilterValueDisplayProps<TData, 'date'>) {
  if (!filter) return null
  if (filter.values.length === 0) return <Ellipsis className="size-4" />
  if (filter.values.length === 1) {
    const value = filter.values[0]

    const formattedDateStr = format(value, 'MMM d, yyyy')

    return <span>{formattedDateStr}</span>
  }

  const formattedRangeStr = formatDateRange(filter.values[0], filter.values[1])

  return <span>{formattedRangeStr}</span>
}

export function FilterValueTextDisplay<TData>({
  filter,
  column,
  actions,
}: FilterValueDisplayProps<TData, 'text'>) {
  if (!filter) return null
  if (filter.values.length === 0 || filter.values[0].trim() === '')
    return <Ellipsis className="size-4" />

  const value = filter.values[0]

  return <span>{value}</span>
}

export function FilterValueNumberDisplay<TData>({
  filter,
  column,
  actions,
}: FilterValueDisplayProps<TData, 'number'>) {
  const maxFromMeta = column.max
  const cappedMax = maxFromMeta ?? 2147483647

  if (!filter) return null

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = filter.values[0]
    const maxValue =
      filter.values[1] === Number.POSITIVE_INFINITY ||
      filter.values[1] >= cappedMax
        ? `${cappedMax}+`
        : filter.values[1]

    return (
      <span className="tabular-nums tracking-tight">
        {minValue} and {maxValue}
      </span>
    )
  }

  if (!filter.values || filter.values.length === 0) {
    return null
  }

  const value = filter.values[0]
  return <span className="tabular-nums tracking-tight">{value}</span>
}

/****** Property Filter Value Controller ******/

interface FilterValueControllerProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
}

export const FilterValueController = memo(
  __FilterValueController,
) as typeof __FilterValueController

function __FilterValueController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionController
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
        />
      )
    case 'date':
      return (
        <FilterValueDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
        />
      )
    case 'text':
      return (
        <FilterValueTextController
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
        />
      )
    case 'number':
      return (
        <FilterValueNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
        />
      )
    default:
      return null
  }
}

export function FilterValueOptionController<TData>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, 'option'>) {
  const options = useMemo(() => column.getOptions(), [column])
  const optionsCount = useMemo(() => column.getFacetedUniqueValues(), [column])

  function handleOptionSelect(value: string, check: boolean) {
    if (check) actions.addFilterValue(column, [value])
    else actions.removeFilterValue(column, [value])
  }

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search..." />
      <CommandEmpty>No results.</CommandEmpty>
      <CommandList className="max-h-fit">
        <CommandGroup>
          {options.map((v) => {
            const checked = Boolean(filter?.values.includes(v.value))
            const count = optionsCount.get(v.value) ?? 0

            return (
              <CommandItem
                key={v.value}
                onSelect={() => {
                  handleOptionSelect(v.value, !checked)
                }}
                className="group flex items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    checked={checked}
                    className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                  />
                  {v.icon &&
                    (isValidElement(v.icon) ? (
                      v.icon
                    ) : (
                      <v.icon className="size-4 text-primary" />
                    ))}
                  <span>
                    {v.label}
                    <sup
                      className={cn(
                        'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                        count === 0 && 'slashed-zero',
                      )}
                    >
                      {count < 100 ? count : '100+'}
                    </sup>
                  </span>
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueMultiOptionController<TData>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, 'multiOption'>) {
  const options = useMemo(() => column.getOptions(), [column])
  const optionsCount = useMemo(() => column.getFacetedUniqueValues(), [column])

  // Handles the selection/deselection of an option
  function handleOptionSelect(value: string, check: boolean) {
    if (check) actions.addFilterValue(column, [value])
    else actions.removeFilterValue(column, [value])
  }

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search..." />
      <CommandEmpty>No results.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {options.map((v) => {
            const checked = Boolean(filter?.values?.includes(v.value))
            const count = optionsCount.get(v.value) ?? 0

            return (
              <CommandItem
                key={v.value}
                onSelect={() => {
                  handleOptionSelect(v.value, !checked)
                }}
                className="group flex items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    checked={checked}
                    className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                  />
                  {v.icon &&
                    (isValidElement(v.icon) ? (
                      v.icon
                    ) : (
                      <v.icon className="size-4 text-primary" />
                    ))}
                  <span>
                    {v.label}
                    <sup
                      className={cn(
                        'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                        count === 0 && 'slashed-zero',
                      )}
                    >
                      {count < 100 ? count : '100+'}
                    </sup>
                  </span>
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueDateController<TData>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, 'date'>) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: filter?.values[0] ?? new Date(),
    to: filter?.values[1] ?? undefined,
  })

  function changeDateRange(value: DateRange | undefined) {
    const start = value?.from
    const end =
      start && value && value.to && !isEqual(start, value.to)
        ? value.to
        : undefined

    setDate({ from: start, to: end })

    const isRange = start && end
    const newValues = isRange ? [start, end] : start ? [start] : []

    actions.setFilterValue(column, newValues)
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={changeDateRange}
              numberOfMonths={1}
            />
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueTextController<TData>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, 'text'>) {
  const changeText = (value: string | number) => {
    actions.setFilterValue(column, [String(value)])
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <CommandItem>
            <DebouncedInput
              placeholder="Search..."
              autoFocus
              value={filter?.values[0] ?? ''}
              onChange={changeText}
            />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueNumberController<TData>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, 'number'>) {
  const [datasetMin, datasetMax] = useMemo(
    () => column.getFacetedMinMaxValues(),
    [column],
  )
  const [sliderMin, sliderMax] = [
    column.min ?? datasetMin,
    column.max ?? datasetMax,
  ]

  // Local state for values
  const [values, setValues] = useState(filter?.values ?? [0, 0])

  // Sync with parent filter changes
  useEffect(() => {
    // console.log('a')
    if (
      filter?.values &&
      filter.values.length === values.length &&
      filter.values.every((v, i) => v === values[i])
    ) {
      setValues(filter.values)
    }
  }, [filter?.values, values])

  const isNumberRange =
    filter && numberFilterDetails[filter.operator].target === 'multiple'

  const changeNumber = (value: number[]) => {
    setValues(value)
    // console.log('a')
    actions.setFilterValue(column, value)
  }

  const changeMinNumber = (value: number) => {
    const newValues = [value, values[1]]
    setValues(newValues)
    console.log('[FilterValueNumberController] changeMinNumber')
    actions.setFilterValue(column, newValues)
  }

  const changeMaxNumber = (value: number) => {
    const newValues = [values[0], value]
    setValues(newValues)
    console.log('[FilterValueNumberController] changeMaxNumber')
    actions.setFilterValue(column, newValues)
  }

  const changeType = useCallback(
    (type: 'single' | 'range') => {
      console.log('changeType to:', type)
      const newValues =
        type === 'single'
          ? [values[0]] // Keep the first value for single mode
          : [values[0], values[1] ?? datasetMax] // Use two values for range mode
      const newOperator = type === 'single' ? 'is' : 'is between'

      // Update local state
      setValues(newValues)

      // Update global filter state atomically
      actions.setFilterOperator(column.id, newOperator)
      actions.setFilterValue(column, newValues)
    },
    [values, datasetMax, column, actions],
  )

  return (
    <Command>
      <CommandList className="w-[300px] px-2 py-2">
        <CommandGroup>
          <div className="flex flex-col w-full">
            <Tabs
              value={isNumberRange ? 'range' : 'single'}
              onValueChange={(v) => changeType(v as 'single' | 'range')}
            >
              <TabsList className="w-full *:text-xs">
                <TabsTrigger value="single">Single</TabsTrigger>
                <TabsTrigger value="range">Range</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="flex flex-col gap-4 mt-4">
                <Slider
                  value={[values[0]]}
                  onValueChange={(value) => changeNumber(value)}
                  min={sliderMin}
                  max={sliderMax}
                  step={1}
                  aria-orientation="horizontal"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Value</span>
                  <Input
                    id="single"
                    type="number"
                    value={values[0].toString()} // Use values[0] directly
                    onChange={(e) => changeNumber([Number(e.target.value)])}
                    min={datasetMin}
                    max={datasetMax}
                  />
                </div>
              </TabsContent>
              <TabsContent value="range" className="flex flex-col gap-4 mt-4">
                <Slider
                  value={values} // Use values directly
                  onValueChange={changeNumber}
                  min={sliderMin}
                  max={sliderMax}
                  step={1}
                  aria-orientation="horizontal"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Min</span>
                    <DebouncedInput
                      type="number"
                      value={values[0]}
                      onChange={(v) => changeMinNumber(Number(v))}
                      min={datasetMin}
                      max={datasetMax}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Max</span>
                    <DebouncedInput
                      type="number"
                      value={values[1]}
                      onChange={(v) => changeMaxNumber(Number(v))}
                      min={datasetMin}
                      max={datasetMax}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function ActiveFiltersMobileContainer({
  children,
}: { children: React.ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftBlur, setShowLeftBlur] = useState(false)
  const [showRightBlur, setShowRightBlur] = useState(true)

  // Check if there's content to scroll and update blur states
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current

      // Show left blur if scrolled to the right
      setShowLeftBlur(scrollLeft > 0)

      // Show right blur if there's more content to scroll to the right
      // Add a small buffer (1px) to account for rounding errors
      setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  // Log blur states for debugging
  // useEffect(() => {
  //   console.log('left:', showLeftBlur, '  right:', showRightBlur)
  // }, [showLeftBlur, showRightBlur])

  // Set up ResizeObserver to monitor container size
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (scrollContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        checkScroll()
      })
      resizeObserver.observe(scrollContainerRef.current)
      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  // Update blur states when children change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    checkScroll()
  }, [children])

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Left blur effect */}
      {showLeftBlur && (
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent animate-in fade-in-0" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-scroll no-scrollbar"
        onScroll={checkScroll}
      >
        {children}
      </div>

      {/* Right blur effect */}
      {showRightBlur && (
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent animate-in fade-in-0 " />
      )}
    </div>
  )
}

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 500, // This is the wait time, not the function
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounceMs?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue)

  // Sync with initialValue when it changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Define the debounced function with useCallback
  const debouncedOnChange = useCallback(
    debounce((newValue: string | number) => {
      onChange(newValue)
    }, debounceMs), // Pass the wait time here
    [debounceMs, onChange], // Dependencies
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue) // Update local state immediately
    debouncedOnChange(newValue) // Call debounced version
  }

  return <Input {...props} value={value} onChange={handleChange} />
}

// Local debounce function
