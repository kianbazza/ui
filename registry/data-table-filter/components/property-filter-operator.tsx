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
import type { ColumnDataType } from '@/registry/data-table-filter/lib/filters'
import {
  type FilterValue,
  createNumberRange,
  dateFilterDetails,
  filterTypeOperatorDetails,
  multiOptionFilterDetails,
  numberFilterDetails,
  optionFilterDetails,
  textFilterDetails,
} from '@/registry/data-table-filter/lib/filters'
import type { Table } from '@tanstack/react-table'
import { useState } from 'react'

// Renders the filter operator display and menu for a given column filter
// The filter operator display is the label and icon for the filter operator
// The filter operator menu is the dropdown menu for the filter operator
export function PropertyFilterOperatorController<
  TData,
  T extends ColumnDataType,
>({
  id,
  table,
  filter,
}: {
  id: string
  table: Table<TData>
  filter: FilterValue<T>
}) {
  const [open, setOpen] = useState<boolean>(false)

  const close = () => setOpen(false)

  const columnMeta = table.getColumn(id)?.columnDef.meta

  if (!columnMeta) return null

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
      <PopoverContent align="start" className="w-fit p-0">
        <Command loop>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results.</CommandEmpty>
          <CommandList className="max-h-fit">
            <PropertyFilterOperatorMenu
              id={id}
              table={table}
              closeController={close}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function PropertyFilterOperatorDisplay<T extends ColumnDataType>({
  filter,
  filterType,
}: {
  filter: FilterValue<T>
  filterType: T
}) {
  const details = filterTypeOperatorDetails[filterType][filter.operator]

  return <span className="text-slate-500">{details.label}</span>
}

interface PropertyFilterOperatorMenuProps<TData> {
  id: string
  table: Table<TData>
  closeController: () => void
}

export function PropertyFilterOperatorMenu<TData>({
  id,
  table,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const column = table.getColumn(id)

  if (!column) {
    return null
  }

  const { type } = column.columnDef.meta!

  switch (type) {
    case 'option':
      return (
        <PropertyFilterOptionOperatorMenu
          id={id}
          table={table}
          closeController={closeController}
        />
      )
    case 'multiOption':
      return (
        <PropertyFilterMultiOptionOperatorMenu
          id={id}
          table={table}
          closeController={closeController}
        />
      )
    case 'date':
      return (
        <PropertyFilterDateOperatorMenu
          id={id}
          table={table}
          closeController={closeController}
        />
      )
    case 'text':
      return (
        <PropertyFilterTextOperatorMenu
          id={id}
          table={table}
          closeController={closeController}
        />
      )
    case 'number':
      return (
        <PropertyFilterNumberOperatorMenu
          id={id}
          table={table}
          closeController={closeController}
        />
      )
    default:
      return null
  }
}

function PropertyFilterOptionOperatorMenu<TData>({
  id,
  table,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const column = table.getColumn(id)

  if (!column) {
    return null
  }

  const filter = column.getFilterValue() as FilterValue<'option'>
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
  id,
  table,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const column = table.getColumn(id)

  if (!column) {
    return null
  }

  const filter = column.getFilterValue() as FilterValue<'multiOption'>
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
  id,
  table,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const column = table.getColumn(id)

  if (!column) {
    return null
  }

  const filter = column.getFilterValue() as FilterValue<'date'>
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
  id,
  table,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const column = table.getColumn(id)

  if (!column) {
    return null
  }

  const filter = column.getFilterValue() as FilterValue<'text'>
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
  id,
  table,
  closeController,
}: PropertyFilterOperatorMenuProps<TData>) {
  const column = table.getColumn(id)

  if (!column) {
    return null
  }

  const filter = column.getFilterValue() as FilterValue<'number'>

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
