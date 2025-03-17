'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { DebouncedInput } from '@/registry/data-table-filter/components/debounced-input'
import { flatten, take, uniq } from '@/registry/data-table-filter/lib/array'
import type {
  ColumnOption,
  ElementType,
} from '@/registry/data-table-filter/lib/filters'
import {
  type FilterValue,
  determineNewOperator,
  numberFilterDetails,
} from '@/registry/data-table-filter/lib/filters'
import type {
  Column,
  ColumnMeta,
  Row,
  RowData,
  Table,
} from '@tanstack/react-table'
import { format, isEqual } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import { cloneElement, isValidElement, useState } from 'react'
import type { DateRange } from 'react-day-picker'

export function PropertyFilterValueController<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: {
  id: string
  column: Column<TData>
  columnMeta: ColumnMeta<TData, TValue>
  table: Table<TData>
}) {
  return (
    <Popover>
      <PopoverAnchor className="h-full" />
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <PropertyFilterValueDisplay
            id={id}
            column={column}
            columnMeta={columnMeta}
            table={table}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <PropertyFilterValueMenu
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      </PopoverContent>
    </Popover>
  )
}

interface PropertyFilterValueDisplayProps<TData, TValue> {
  id: string
  column: Column<TData>
  columnMeta: ColumnMeta<TData, TValue>
  table: Table<TData>
}

export function PropertyFilterValueDisplay<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  switch (columnMeta.type) {
    case 'option':
      return (
        <PropertyFilterOptionValueDisplay
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'multiOption':
      return (
        <PropertyFilterMultiOptionValueDisplay
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'date':
      return (
        <PropertyFilterDateValueDisplay
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'text':
      return (
        <PropertyFilterTextValueDisplay
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'number':
      return (
        <PropertyFilterNumberValueDisplay
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    default:
      return null
  }
}

export function PropertyFilterOptionValueDisplay<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  let options: ColumnOption[]
  const columnVals = table
    .getCoreRowModel()
    .rows.flatMap((r) => r.getValue<TValue>(id))
    .filter((v): v is NonNullable<TValue> => v !== undefined && v !== null)

  // If static options are provided, use them
  if (columnMeta.options) {
    options = columnMeta.options
  }

  // No static options provided,
  // We should dynamically generate them based on the column data
  else if (columnMeta.transformOptionFn) {
    const transformOptionFn = columnMeta.transformOptionFn

    const unique = uniq(columnVals)

    options = unique.map((v) =>
      transformOptionFn(v as ElementType<NonNullable<TValue>>),
    )
  }

  // No static options provided
  // Missing transformOptionFn - throw error
  else {
    throw new Error(
      'No options provided - this is required for multiOption data type without static options',
    )
  }

  const filter = column.getFilterValue() as FilterValue<'option', TData>
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
  const name = columnMeta.displayName.toLowerCase()
  const pluralName = name.endsWith('s') ? `${name}es` : `${name}s`

  const hasOptionIcons = !!columnMeta.options

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

export function PropertyFilterMultiOptionValueDisplay<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  let options: ColumnOption[]
  const columnVals = table
    .getCoreRowModel()
    .rows.flatMap((r) => r.getValue<TValue>(id))
    .filter((v): v is NonNullable<TValue> => v !== undefined && v !== null)

  // If static options are provided, use them
  if (columnMeta.options) {
    options = columnMeta.options
  }

  // No static options provided,
  // We should dynamically generate them based on the column data
  else if (columnMeta.transformOptionFn) {
    const transformOptionFn = columnMeta.transformOptionFn

    const unique = uniq(columnVals)

    options = unique.map((v) =>
      transformOptionFn(v as ElementType<NonNullable<TValue>>),
    )
  }

  // No static options provided
  // Missing transformOptionFn - throw error
  else {
    throw new Error(
      'No options provided - this is required for multiOption data type without static options',
    )
  }

  const filter = column.getFilterValue() as FilterValue<'multiOption', TData>
  const selected = options.filter((o) => filter?.values[0].includes(o.value))

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

  const name = columnMeta.displayName.toLowerCase()

  const hasOptionIcons = !columnMeta.options?.some((o) => !o.icon)

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

export function PropertyFilterDateValueDisplay<TData, TValue>({
  column,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'date', TData>)
    : undefined

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

export function PropertyFilterTextValueDisplay<TData, TValue>({
  column,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'text', TData>)
    : undefined

  if (!filter) return null
  if (filter.values.length === 0 || filter.values[0].trim() === '')
    return <Ellipsis className="size-4" />

  const value = filter.values[0]

  return <span>{value}</span>
}

export function PropertyFilterNumberValueDisplay<TData, TValue>({
  column,
  columnMeta,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  const maxFromMeta = columnMeta.max
  const cappedMax = maxFromMeta ?? 2147483647

  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'number', TData>)
    : undefined

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

export function PropertyFilterValueMenu<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: {
  id: string
  column: Column<TData>
  columnMeta: ColumnMeta<TData, TValue>
  table: Table<TData>
}) {
  switch (columnMeta.type) {
    case 'option':
      return (
        <PropertyFilterOptionValueMenu
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'multiOption':
      return (
        <PropertyFilterMultiOptionValueMenu
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'date':
      return (
        <PropertyFilterDateValueMenu
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'text':
      return (
        <PropertyFilterTextValueMenu
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    case 'number':
      return (
        <PropertyFilterNumberValueMenu
          id={id}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      )
    default:
      return null
  }
}

interface ProperFilterValueMenuProps<TData, TValue> {
  id: string
  column: Column<TData>
  columnMeta: ColumnMeta<TData, TValue>
  table: Table<TData>
}

export function PropertyFilterOptionValueMenu<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'option', TData>)
    : undefined

  let options: ColumnOption[]
  const columnVals = table
    .getCoreRowModel()
    .rows.flatMap((r) => r.getValue<TValue>(id))
    .filter((v): v is NonNullable<TValue> => v !== undefined && v !== null)

  // If static options are provided, use them
  if (columnMeta.options) {
    options = columnMeta.options
  }

  // No static options provided,
  // We should dynamically generate them based on the column data
  else if (columnMeta.transformOptionFn) {
    const transformOptionFn = columnMeta.transformOptionFn

    const unique = uniq(columnVals)

    options = unique.map((v) =>
      transformOptionFn(v as ElementType<NonNullable<TValue>>),
    )
  }

  // No static options provided
  // Missing transformOptionFn - throw error
  else {
    throw new Error(
      'No options provided - this is required for multiOption data type without static options',
    )
  }

  const optionsCount: Record<ColumnOption['value'], number> = columnVals.reduce(
    (acc, curr) => {
      const { value } = columnMeta.transformOptionFn
        ? columnMeta.transformOptionFn(curr as ElementType<NonNullable<TValue>>)
        : { value: curr as string }

      acc[value] = (acc[value] ?? 0) + 1
      return acc
    },
    {} as Record<ColumnOption['value'], number>,
  )

  function handleOptionSelect(value: string, check: boolean) {
    if (check)
      column?.setFilterValue(
        (old: undefined | FilterValue<'option', TData>) => {
          if (!old || old.values.length === 0)
            return {
              operator: 'is',
              values: [value],
              column,
            } satisfies FilterValue<'option', TData>

          const newValues = [...old.values, value]

          return {
            operator: 'is any of',
            values: newValues,
            column,
          } satisfies FilterValue<'option', TData>
        },
      )
    else
      column?.setFilterValue(
        (old: undefined | FilterValue<'option', TData>) => {
          if (!old || old.values.length <= 1) return undefined

          const newValues = old.values.filter((v) => v !== value)
          return {
            operator: newValues.length > 1 ? 'is any of' : 'is',
            values: newValues,
            column,
          } satisfies FilterValue<'option', TData>
        },
      )
  }

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search..." />
      <CommandEmpty>No results.</CommandEmpty>
      <CommandList className="max-h-fit">
        <CommandGroup>
          {options.map((v) => {
            const checked = Boolean(filter?.values.includes(v.value))
            const count = optionsCount[v.value] ?? 0

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

export function PropertyFilterMultiOptionValueMenu<
  TData extends RowData,
  TValue,
>({
  id,
  column,
  columnMeta,
  table,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const filter = column.getFilterValue() as
    | FilterValue<'multiOption', TData>
    | undefined

  let options: ColumnOption[]
  const columnVals = table
    .getCoreRowModel()
    .rows.flatMap((r) => r.getValue<TValue>(id))
    .filter((v): v is NonNullable<TValue> => v !== undefined && v !== null)

  // If static options are provided, use them
  if (columnMeta.options) {
    options = columnMeta.options
  }

  // No static options provided,
  // We should dynamically generate them based on the column data
  else if (columnMeta.transformOptionFn) {
    const transformOptionFn = columnMeta.transformOptionFn

    const unique = uniq(columnVals)

    options = unique.map((v) =>
      transformOptionFn(v as ElementType<NonNullable<TValue>>),
    )
  }

  // No static options provided
  // Missing transformOptionFn - throw error
  else {
    throw new Error(
      'No options provided - this is required for multiOption data type without static options',
    )
  }

  const optionsCount: Record<ColumnOption['value'], number> = columnVals.reduce(
    (acc, curr) => {
      const { value } = columnMeta.transformOptionFn!(
        curr as ElementType<NonNullable<TValue>>,
      )

      acc[value] = (acc[value] ?? 0) + 1
      return acc
    },
    {} as Record<ColumnOption['value'], number>,
  )

  // Handles the selection/deselection of an option
  function handleOptionSelect(value: string, check: boolean) {
    if (check) {
      column.setFilterValue(
        (old: undefined | FilterValue<'multiOption', TData>) => {
          if (
            !old ||
            old.values.length === 0 ||
            !old.values[0] ||
            old.values[0].length === 0
          )
            return {
              operator: 'include',
              values: [[value]],
              column,
            } satisfies FilterValue<'multiOption', TData>

          const newValues = [uniq([...old.values[0], value])]

          return {
            operator: determineNewOperator(
              'multiOption',
              old.values,
              newValues,
              old.operator,
            ),
            values: newValues,
            column,
          } satisfies FilterValue<'multiOption', TData>
        },
      )
    } else
      column.setFilterValue(
        (old: undefined | FilterValue<'multiOption', TData>) => {
          if (!old?.values[0] || old.values[0].length <= 1) return undefined

          const newValues = [
            uniq([...old.values[0], value]).filter((v) => v !== value),
          ]

          return {
            operator: determineNewOperator(
              'multiOption',
              old.values,
              newValues,
              old.operator,
            ),
            values: newValues,
            column,
          } satisfies FilterValue<'multiOption', TData>
        },
      )
  }

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search..." />
      <CommandEmpty>No results.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {options.map((v) => {
            const checked = Boolean(filter?.values[0]?.includes(v.value))
            const count = optionsCount[v.value] ?? 0

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

export function PropertyFilterDateValueMenu<TData, TValue>({
  column,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'date', TData>)
    : undefined

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

    column.setFilterValue((old: undefined | FilterValue<'date', TData>) => {
      if (!old || old.values.length === 0)
        return {
          operator: newValues.length > 1 ? 'is between' : 'is',
          values: newValues,
          column,
        } satisfies FilterValue<'date', TData>

      return {
        operator:
          old.values.length < newValues.length
            ? 'is between'
            : old.values.length > newValues.length
              ? 'is'
              : old.operator,
        values: newValues,
        column,
      } satisfies FilterValue<'date', TData>
    })
  }

  return (
    <Command>
      {/* <CommandInput placeholder="Search..." /> */}
      {/* <CommandEmpty>No results.</CommandEmpty> */}
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

export function PropertyFilterTextValueMenu<TData, TValue>({
  column,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'text', TData>)
    : undefined

  const changeText = (value: string | number) => {
    column.setFilterValue((old: undefined | FilterValue<'text', TData>) => {
      if (!old || old.values.length === 0)
        return {
          operator: 'contains',
          values: [String(value)],
          column,
        } satisfies FilterValue<'text', TData>
      return { operator: old.operator, values: [String(value)] }
    })
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

export function PropertyFilterNumberValueMenu<TData, TValue>({
  table,
  column,
  columnMeta,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const maxFromMeta = columnMeta.max
  const cappedMax = maxFromMeta ?? Number.MAX_SAFE_INTEGER

  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'number', TData>)
    : undefined

  const isNumberRange =
    !!filter && numberFilterDetails[filter.operator].target === 'multiple'

  const [datasetMin] = column.getFacetedMinMaxValues() ?? [0, 0]

  const initialValues = () => {
    if (filter?.values) {
      return filter.values.map((val) =>
        val >= cappedMax ? `${cappedMax}+` : val.toString(),
      )
    }
    return [datasetMin.toString()]
  }

  const [inputValues, setInputValues] = useState<string[]>(initialValues)

  const changeNumber = (value: number[]) => {
    const sortedValues = [...value].sort((a, b) => a - b)

    column.setFilterValue((old: undefined | FilterValue<'number', TData>) => {
      if (!old || old.values.length === 0) {
        return {
          operator: 'is',
          values: sortedValues,
        }
      }

      const operator = numberFilterDetails[old.operator]
      let newValues: number[]

      if (operator.target === 'single') {
        newValues = [sortedValues[0]]
      } else {
        newValues = [
          sortedValues[0] >= cappedMax ? cappedMax : sortedValues[0],
          sortedValues[1] >= cappedMax
            ? Number.POSITIVE_INFINITY
            : sortedValues[1],
        ]
      }

      return {
        operator: old.operator,
        values: newValues,
      }
    })
  }

  const handleInputChange = (index: number, value: string) => {
    const newValues = [...inputValues]
    if (isNumberRange && Number.parseInt(value, 10) >= cappedMax) {
      newValues[index] = `${cappedMax}+`
    } else {
      newValues[index] = value
    }

    setInputValues(newValues)

    const parsedValues = newValues.map((val) => {
      if (val.trim() === '') return 0
      if (val === `${cappedMax}+`) return cappedMax
      return Number.parseInt(val, 10)
    })

    changeNumber(parsedValues)
  }

  const changeType = (type: 'single' | 'range') => {
    column.setFilterValue((old: undefined | FilterValue<'number', TData>) => {
      if (type === 'single') {
        return {
          operator: 'is',
          values: [old?.values[0] ?? 0],
        }
      }
      const newMaxValue = old?.values[0] ?? cappedMax
      return {
        operator: 'is between',
        values: [0, newMaxValue],
      }
    })

    if (type === 'single') {
      setInputValues([inputValues[0]])
    } else {
      const maxValue = inputValues[0] || cappedMax.toString()
      setInputValues(['0', maxValue])
    }
  }

  const slider = {
    value: inputValues.map((val) =>
      val === '' || val === `${cappedMax}+`
        ? cappedMax
        : Number.parseInt(val, 10),
    ),
    onValueChange: (value: number[]) => {
      const values = value.map((val) => (val >= cappedMax ? cappedMax : val))
      setInputValues(
        values.map((v) => (v >= cappedMax ? `${cappedMax}+` : v.toString())),
      )
      changeNumber(values)
    },
  }

  return (
    <Command>
      <CommandList className="w-[300px] px-2 py-2">
        <CommandGroup>
          <div className="flex flex-col w-full">
            <Tabs
              value={isNumberRange ? 'range' : 'single'}
              onValueChange={(v) =>
                changeType(v === 'range' ? 'range' : 'single')
              }
            >
              <TabsList className="w-full *:text-xs">
                <TabsTrigger value="single">Single</TabsTrigger>
                <TabsTrigger value="range">Range</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="flex flex-col gap-4 mt-4">
                <Slider
                  value={[Number(inputValues[0])]}
                  onValueChange={(value) => {
                    handleInputChange(0, value[0].toString())
                  }}
                  min={datasetMin}
                  max={cappedMax}
                  step={1}
                  aria-orientation="horizontal"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Value</span>
                  <Input
                    id="single"
                    type="number"
                    value={inputValues[0]}
                    onChange={(e) => handleInputChange(0, e.target.value)}
                    max={cappedMax}
                  />
                </div>
              </TabsContent>
              <TabsContent value="range" className="flex flex-col gap-4 mt-4">
                <Slider
                  value={slider.value}
                  onValueChange={slider.onValueChange}
                  min={datasetMin}
                  max={cappedMax}
                  step={1}
                  aria-orientation="horizontal"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Min</span>
                    <Input
                      type="number"
                      value={inputValues[0]}
                      onChange={(e) => handleInputChange(0, e.target.value)}
                      max={cappedMax}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Max</span>
                    <Input
                      type="text"
                      value={inputValues[1]}
                      placeholder={`${cappedMax}+`}
                      onChange={(e) => handleInputChange(1, e.target.value)}
                      max={cappedMax}
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
