import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useState } from 'react'
import {
  getDateFilterDetails,
  getFilterTypeOperatorDetails,
  getMultiOptionFilterDetails,
  getNumberFilterDetails,
  getOptionFilterDetails,
  getTextFilterDetails,
} from '../core/operators'
import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterOperators,
  FilterStrategy,
} from '../core/types'
import { type Locale, t } from '../lib/i18n'

interface FilterOperatorProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
  filter: FilterModel<TType>
  actions: DataTableFilterActions
  locale: Locale
}

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function FilterOperator<TData, TType extends ColumnDataType>({
  column,
  filter,
  actions,
  locale,
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
          <FilterOperatorDisplay
            filter={filter}
            columnType={column.type}
            locale={locale}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <Command loop>
          <CommandInput placeholder={t('search', locale)} />
          <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
          <CommandList className="max-h-fit">
            <FilterOperatorController
              filter={filter}
              column={column}
              actions={actions}
              closeController={close}
              locale={locale}
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
  locale: Locale
}

export function FilterOperatorDisplay<TType extends ColumnDataType>({
  filter,
  columnType,
  locale,
}: FilterOperatorDisplayProps<TType>) {
  const operator =
    getFilterTypeOperatorDetails(locale)[columnType][filter.operator]

  return <span className="text-muted-foreground">{operator.label}</span>
}

interface FilterOperatorControllerProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  closeController: () => void
  locale: Locale
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
  locale,
}: FilterOperatorControllerProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterOperatorOptionController
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )
    case 'multiOption':
      return (
        <FilterOperatorMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )
    case 'date':
      return (
        <FilterOperatorDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )
    case 'text':
      return (
        <FilterOperatorTextController
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )
    case 'number':
      return (
        <FilterOperatorNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
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
  locale,
}: FilterOperatorControllerProps<TData, 'option'>) {
  const filterDetails = getOptionFilterDetails(locale)[filter.operator]

  const relatedFilters = Object.values(getOptionFilterDetails(locale)).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['option'])
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
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
  locale,
}: FilterOperatorControllerProps<TData, 'multiOption'>) {
  const filterDetails = getMultiOptionFilterDetails(locale)[filter.operator]

  const relatedFilters = Object.values(
    getMultiOptionFilterDetails(locale),
  ).filter((o) => o.target === filterDetails.target)

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(
      column.id,
      value as FilterOperators['multiOption'],
    )
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
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
  locale,
}: FilterOperatorControllerProps<TData, 'date'>) {
  const filterDetails = getDateFilterDetails(locale)[filter.operator]

  const relatedFilters = Object.values(getDateFilterDetails(locale)).filter(
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
  locale,
}: FilterOperatorControllerProps<TData, 'text'>) {
  const filterDetails = getTextFilterDetails(locale)[filter.operator]

  const relatedFilters = Object.values(getTextFilterDetails(locale)).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['text'])
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
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
  locale,
}: FilterOperatorControllerProps<TData, 'number'>) {
  // Show all related operators
  const filterDetails = getNumberFilterDetails(locale)[filter.operator]

  const relatedFilters = Object.values(getNumberFilterDetails(locale)).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['number'])
    closeController()
  }

  return (
    <div>
      <CommandGroup heading={t('operators', locale)}>
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
