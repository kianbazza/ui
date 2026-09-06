'use client'

import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import {
  isBooleanColumn,
  isBooleanFilter,
  isDateColumn,
  isDateFilter,
  isMultiOptionColumn,
  isMultiOptionFilter,
  isNumberColumn,
  isNumberFilter,
  isOptionColumn,
  isOptionFilter,
  isTextColumn,
  isTextFilter,
  take,
} from '@bazza-ui/filters'

import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import type * as React from 'react'
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import {
  useFilterActions,
  useFilterEntityName,
  useFilterLocale,
  useFilterStrategy,
} from '../root/filter-context'
import {
  FilterValueDateController,
  FilterValueNumberController,
  OptionEditorContent,
  TextEditorContent,
} from '../value'
import { useFilterItemContext } from './filter-item'

export interface FilterValueProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  /** The current filter state. If omitted, will be read from FilterItem context. */
  filter?: FilterModel<TType>
  /** The column configuration. If omitted, will be read from FilterItem context. */
  column?: Column<TData, TType>
  /** Filter actions. If omitted, will be read from FilterItem or Filter context. */
  actions?: DataTableFilterActions
  /** Filter strategy. If omitted, will be read from FilterItem or Filter context. */
  strategy?: FilterStrategy
  locale?: Locale
  entityName?: string
  className?: string
}

/**
 * Displays and allows editing the filter value.
 * Renders a `<button>` element with a dropdown menu.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
export const FilterValue = forwardRef<HTMLButtonElement, FilterValueProps>(
  (
    {
      filter: filterProp,
      column: columnProp,
      actions: actionsProp,
      strategy: strategyProp,
      locale: localeProp,
      entityName: entityNameProp,
      className,
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const filterActions = useFilterActions()
    const filterStrategy = useFilterStrategy()
    const filterLocale = useFilterLocale()
    const filterEntityName = useFilterEntityName()

    const filter = filterProp ?? itemContext?.filter
    const column = columnProp ?? itemContext?.column
    const actions = actionsProp ?? itemContext?.actions ?? filterActions
    const strategy = strategyProp ?? itemContext?.strategy ?? filterStrategy
    const locale = localeProp ?? itemContext?.locale ?? filterLocale ?? 'en'
    const entityName =
      entityNameProp ?? itemContext?.entityName ?? filterEntityName

    if (!filter || !column || !actions || !strategy) {
      throw new Error(
        'FilterValue requires filter, column, actions, and strategy props or must be used within FilterItem',
      )
    }

    // After validation, we can safely use these non-null values
    const resolvedFilter = filter
    const resolvedColumn = column
    const resolvedActions = actions
    const resolvedStrategy = strategy

    const [open, setOpen] = useState(false)

    // Don't open the value controller for boolean columns
    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (isBooleanColumn(resolvedColumn)) e.preventDefault()
    }

    // Keep a ref to the latest filter values to avoid stale closure in onOpenChange
    const latestFilterValuesRef = useRef(resolvedFilter.values)
    latestFilterValuesRef.current = resolvedFilter.values

    // Used only for option/multiOption to track initial selection order
    const initialFilterValuesRef = useRef<
      (string | number | bigint | boolean | Date)[]
    >([])

    // Determine column type for rendering
    const isTextType = isTextColumn(resolvedColumn)
    const isDateType = isDateColumn(resolvedColumn)
    const isNumberType = isNumberColumn(resolvedColumn)
    const isSelectableType =
      isOptionColumn(resolvedColumn) || isMultiOptionColumn(resolvedColumn)

    if (isBooleanColumn(resolvedColumn)) {
      return (
        <div
          data-slot="filter-value"
          data-column-type={resolvedColumn.type}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs h-full rounded-none',
            'text-primary/75 hover:bg-inherit hover:text-primary/75 hover:shadow-none',
            className,
          )}
        >
          <FilterValueDisplay
            filter={resolvedFilter}
            column={resolvedColumn}
            locale={locale}
            entityName={entityName}
          />
        </div>
      )
    }

    return (
      <DropdownMenu.Root
        open={open}
        onOpenChange={(value) => {
          if (value) {
            // Capture filter values when CLOSING - use ref to avoid stale closure
            initialFilterValuesRef.current = latestFilterValuesRef.current
          }
          setOpen(value)
        }}
      >
        <DropdownMenu.Trigger
          render={
            <Button
              ref={ref}
              data-slot="filter-value"
              data-column-type={resolvedColumn.type}
              variant="ghost"
              className={cn(
                'm-0 w-fit whitespace-nowrap p-0 px-2 text-xs h-full rounded-none',
                className,
              )}
              onClick={handleClick}
            />
          }
        >
          <FilterValueDisplay
            filter={resolvedFilter}
            column={resolvedColumn}
            locale={locale}
            entityName={entityName}
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner align="list-start" disableAnchorTracking>
            <DropdownMenu.Popup
              className={cn((isDateType || isNumberType) && 'w-full')}
            >
              {isTextType ? (
                <TextEditorContent
                  column={resolvedColumn as Column<unknown, 'text'>}
                  actions={resolvedActions}
                />
              ) : isDateType ? (
                <DropdownMenu.Surface>
                  <FilterValueDateController
                    filter={resolvedFilter as FilterModel<'date'>}
                    column={resolvedColumn as Column<unknown, 'date'>}
                    actions={resolvedActions}
                    strategy={resolvedStrategy}
                    locale={locale}
                  />
                </DropdownMenu.Surface>
              ) : isNumberType ? (
                // <DropdownMenu.Surface>
                <FilterValueNumberController
                  filter={resolvedFilter as FilterModel<'number'>}
                  column={resolvedColumn as Column<unknown, 'number'>}
                  actions={resolvedActions}
                  strategy={resolvedStrategy}
                  locale={locale}
                />
                // </DropdownMenu.Surface>
              ) : isSelectableType ? (
                <OptionEditorContent
                  column={
                    resolvedColumn as
                      | Column<unknown, 'option'>
                      | Column<unknown, 'multiOption'>
                  }
                  actions={resolvedActions}
                  filter={
                    resolvedFilter as
                      | FilterModel<'option'>
                      | FilterModel<'multiOption'>
                  }
                  locale={locale}
                  strategy={resolvedStrategy}
                  initialValues={initialFilterValuesRef.current}
                  showSeparator
                />
              ) : null}
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  },
)

FilterValue.displayName = 'FilterValue'

// Display components for each type
export interface FilterValueDisplayProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  locale?: Locale
  entityName?: string
}

export function FilterValueDisplay<TData, TType extends ColumnDataType>({
  filter,
  column,
  locale = 'en',
}: FilterValueDisplayProps<TData, TType>) {
  if (isOptionColumn(column) && isOptionFilter(filter)) {
    return (
      <FilterValueSelectableDisplay
        filter={filter}
        column={column as Column<unknown, 'option'>}
      />
    )
  }

  if (isMultiOptionColumn(column) && isMultiOptionFilter(filter)) {
    return (
      <FilterValueSelectableDisplay
        filter={filter}
        column={column as Column<unknown, 'multiOption'>}
      />
    )
  }

  if (isDateColumn(column) && isDateFilter(filter)) {
    return <FilterValueDateDisplay filter={filter} />
  }

  if (isTextColumn(column) && isTextFilter(filter)) {
    return <FilterValueTextDisplay filter={filter} />
  }

  if (isNumberColumn(column) && isNumberFilter(filter)) {
    return <FilterValueNumberDisplay filter={filter} locale={locale} />
  }

  if (isBooleanColumn(column) && isBooleanFilter(filter)) {
    return (
      <FilterValueBooleanDisplay
        filter={filter}
        column={column as Column<unknown, 'boolean'>}
      />
    )
  }

  return null
}

/**
 * Unified display component for option and multiOption filter values.
 * Shows single selection with icon, or multiple selections with count.
 */
function FilterValueSelectableDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'option'> | FilterModel<'multiOption'>
  column: Column<unknown, 'option'> | Column<unknown, 'multiOption'>
}) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) =>
    filter?.values.includes(o.value as string),
  )

  // Single selection - show label with icon
  if (selected.length === 1 && selected[0]) {
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

  // Multiple selections - show count with icons
  const name = column.displayName.toLowerCase()
  // For 'option' type, pluralize; for 'multiOption', use as-is
  const displayName =
    column.type === 'option'
      ? name.endsWith('s')
        ? `${name}es`
        : `${name}s`
      : name
  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-2">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {take(selected, 3).map(({ value, icon }) => {
            const Icon = icon!
            return isValidElement(Icon) ? (
              cloneElement(Icon, { key: value as string })
            ) : (
              <Icon key={value as string} className="size-4" />
            )
          })}
        </div>
      )}
      <span>
        {selected.length} {displayName}
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

function FilterValueDateDisplay({ filter }: { filter: FilterModel<'date'> }) {
  if (!filter) return null
  if (filter.values.length === 0) return <Ellipsis className="size-4" />
  if (filter.values.length === 1 && filter.values[0]) {
    const value = filter.values[0]
    const formattedDateStr = format(value, 'MMM d, yyyy')
    return <span>{formattedDateStr}</span>
  }
  if (filter.values.length === 2 && filter.values[0] && filter.values[1]) {
    const formattedRangeStr = formatDateRange(
      filter.values[0],
      filter.values[1],
    )
    return <span>{formattedRangeStr}</span>
  }
  return null
}

function FilterValueTextDisplay({ filter }: { filter: FilterModel<'text'> }) {
  if (!filter) return null
  if (
    filter.values.length === 0 ||
    (filter.values[0] && filter.values[0].trim() === '')
  )
    return <Ellipsis className="size-4" />
  return <span>{filter.values[0]}</span>
}

function FilterValueNumberDisplay({
  filter,
  locale = 'en',
}: {
  filter: FilterModel<'number'>
  locale?: Locale
}) {
  if (!filter?.values || filter.values.length === 0) return null

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = filter.values[0]
    const maxValue = filter.values[1]
    const andText = locale === 'en' ? 'and' : 'and' // Add translations as needed
    return (
      <span className="tabular-nums tracking-tight">
        {minValue} {andText} {maxValue}
      </span>
    )
  }

  return <span className="tabular-nums tracking-tight">{filter.values[0]}</span>
}

function FilterValueBooleanDisplay({
  filter,
  column,
}: {
  filter: FilterModel<'boolean'>
  column: Column<unknown, 'boolean'>
}) {
  if (!filter || filter.values.length === 0) return null
  return <span>{column.toggledStateName}</span>
}

export namespace FilterValue {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterValueProps<TData, TType>
  export type DisplayProps<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterValueDisplayProps<TData, TType>
}
