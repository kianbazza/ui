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
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ColumnDataType } from '@/lib/filters'
import {
  type FilterValue,
  createNumberRange,
  dateFilterDetails,
  filterTypeOperatorDetails,
  multiOptionFilterDetails,
  numberFilterDetails,
  optionFilterDetails,
  textFilterDetails,
} from '@/lib/filters'
import type { Column, ColumnMeta } from '@tanstack/react-table'
import { useState } from 'react'

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function PropertyFilterOperatorController<
  TData,
  T extends ColumnDataType,
>({
  column,
  columnMeta,
  filter,
}: {
  column: Column<TData, unknown>
  columnMeta: ColumnMeta<TData, unknown>
  filter: FilterValue<T, TData>
}) {
  const [open, setOpen] = useState<boolean>(false)

  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <PropertyFilterOperatorDisplay
            filter={filter}
            filterType={columnMeta.type}
          />
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
            <PropertyFilterOperatorMenu
              column={column}
              closeController={close}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function PropertyFilterOperatorDisplay<TData, T extends ColumnDataType>({
  filter,
  filterType,
}: {
  filter: FilterValue<T, TData>
  filterType: T
}) {
  const details = filterTypeOperatorDetails[filterType][filter.operator]

  return <span>{details.label}</span>
}

interface PropertyFilterOperatorMenuProps<TData> {
  column: Column<TData, unknown>
  closeController: () => void
}

export function PropertyFilterOperatorMenu<TData>({
  column,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const { type } = column.columnDef.meta!

  switch (type) {
    case 'option':
      return (
        <PropertyFilterOptionOperatorMenu
          column={column}
          closeController={closeController}
        />
      )
    case 'multiOption':
      return (
        <PropertyFilterMultiOptionOperatorMenu
          column={column}
          closeController={closeController}
        />
      )
    case 'date':
      return (
        <PropertyFilterDateOperatorMenu
          column={column}
          closeController={closeController}
        />
      )
    case 'text':
      return (
        <PropertyFilterTextOperatorMenu
          column={column}
          closeController={closeController}
        />
      )
    case 'number':
      return (
        <PropertyFilterNumberOperatorMenu
          column={column}
          closeController={closeController}
        />
      )
    default:
      return null
  }
}

function PropertyFilterOptionOperatorMenu<TData>({
  column,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const filter = column.getFilterValue() as FilterValue<'option', TData>
  const filterDetails = optionFilterDetails[filter.operator]

  const relatedFilters = Object.values(optionFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    column.setFilterValue((old: typeof filter) => ({ ...old, operator: value }))
    closeController()
  }

  return (
    <CommandGroup heading="Operators">
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.value}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function PropertyFilterMultiOptionOperatorMenu<TData>({
  column,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const filter = column.getFilterValue() as FilterValue<'multiOption', TData>
  const filterDetails = multiOptionFilterDetails[filter.operator]

  const relatedFilters = Object.values(multiOptionFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    column.setFilterValue((old: typeof filter) => ({ ...old, operator: value }))
    closeController()
  }

  return (
    <CommandGroup heading="Operators">
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.value}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function PropertyFilterDateOperatorMenu<TData>({
  column,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const filter = column.getFilterValue() as FilterValue<'date', TData>
  const filterDetails = dateFilterDetails[filter.operator]

  const relatedFilters = Object.values(dateFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    column.setFilterValue((old: typeof filter) => ({ ...old, operator: value }))
    closeController()
  }

  return (
    <CommandGroup>
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.value}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

export function PropertyFilterTextOperatorMenu<TData>({
  column,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const filter = column.getFilterValue() as FilterValue<'text', TData>
  const filterDetails = textFilterDetails[filter.operator]

  const relatedFilters = Object.values(textFilterDetails).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    column.setFilterValue((old: typeof filter) => ({ ...old, operator: value }))
    closeController()
  }

  return (
    <CommandGroup heading="Operators">
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {r.value}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function PropertyFilterNumberOperatorMenu<TData>({
  column,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const filter = column.getFilterValue() as FilterValue<'number', TData>

  // Show all related operators
  const relatedFilters = Object.values(numberFilterDetails)
  const relatedFilterOperators = relatedFilters.map((r) => r.value)

  const changeOperator = (value: (typeof relatedFilterOperators)[number]) => {
    column.setFilterValue((old: typeof filter) => {
      // Clear out the second value when switching to single-input operators
      const target = numberFilterDetails[value].target

      const newValues =
        target === 'single' ? [old.values[0]] : createNumberRange(old.values)

      return { ...old, operator: value, values: newValues }
    })
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
            {r.value} {/**/}
          </CommandItem>
        ))}
      </CommandGroup>
    </div>
  )
}
