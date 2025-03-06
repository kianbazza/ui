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
  CommandSeparator,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { DebouncedInput } from '@/registry/data-table-filter/components/debounced-input'
import { flatten, take, uniq } from '@/registry/data-table-filter/lib/array'
import type { ColumnOption } from '@/registry/data-table-filter/lib/filters'
import {
  type FilterValue,
  determineNewOperator,
  numberFilterDetails,
} from '@/registry/data-table-filter/lib/filters'
import type { Column, ColumnMeta, Row, Table } from '@tanstack/react-table'
import { format, isEqual } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import { isValidElement, useState } from 'react'
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
      <PopoverContent className="w-fit p-0" align="start" side="bottom">
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
  const providedOptions = columnMeta.options

  let options: ColumnOption[]

  if (providedOptions) {
    // If provided options are available for the column, use them
    options = providedOptions
  } else if (columnMeta.transformFn) {
    // No provided options, we should dynamically generate them based on the column data
    // If a transform function is provided, we use it to transform the column data into
    // an acceptable format
    const columnVals = table.getCoreRowModel().rows.map((r) => r.getValue(id))
    const transformed = columnVals.map(columnMeta.transformFn) as string[]
    const unique = uniq(transformed)
    options = unique.map((value) => {
      const option: ColumnOption = {
        value: value,
        label: value,
        icon: undefined,
      }
      return option
    })
  } else {
    // No provided options or transform function
    // We should generate options based on the raw column data
    const columnVals = table
      .getCoreRowModel()
      .rows.map((r) => r.getValue<string>(id))
    const unique = uniq(columnVals)
    options = unique.map((value) => {
      const option: ColumnOption = {
        value: value,
        label: value,
        icon: undefined,
      }
      return option
    })
  }

  const filter = column.getFilterValue() as FilterValue<'option'>
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
  const providedOptions = columnMeta.options

  let options: ColumnOption[]

  if (providedOptions) {
    options = providedOptions
  } else if (columnMeta.transformFn) {
    const columnVals = table.getCoreRowModel().rows.map((r) => r.getValue(id))
    const transformed = columnVals.map(columnMeta.transformFn) as string[][]
    const flattened = flatten(transformed)
    const unique = uniq(flattened)
    options = unique.map((value) => {
      const option: ColumnOption = {
        value: value,
        label: value,
        icon: undefined,
      }
      return option
    })
  } else {
    const columnVals = table
      .getCoreRowModel()
      .rows.map((r) => r.getValue<string[]>(id))
    const flattened = flatten(columnVals)
    const unique = uniq(flattened)
    options = unique.map((value) => {
      const option: ColumnOption = {
        value: value,
        label: value,
        icon: undefined,
      }
      return option
    })
  }

  const filter = column.getFilterValue() as FilterValue<'multiOption'>
  const selected = options.filter((o) => filter?.values[0].includes(o.value))

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
    ? (column.getFilterValue() as FilterValue<'date'>)
    : undefined

  if (!filter) return null
  if (filter.values.length === 0) return <Ellipsis className="size-4" />
  if (filter.values.length === 1) {
    const value = filter.values[0]

    const formattedDateStr = format(value, 'MMM d, yyyy')

    return <span className="text-slate-700">{formattedDateStr}</span>
  }

  const formattedRangeStr = formatDateRange(filter.values[0], filter.values[1])

  return <span className="text-slate-700">{formattedRangeStr}</span>
}

export function PropertyFilterTextValueDisplay<TData, TValue>({
  column,
}: PropertyFilterValueDisplayProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'text'>)
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
    ? (column.getFilterValue() as FilterValue<'number'>)
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
    ? (column.getFilterValue() as FilterValue<'option'>)
    : undefined

  const options = columnMeta.options
    ? columnMeta.options
    : uniq(table.getCoreRowModel().rows.map((r) => r.getValue<string>(id))).map(
        (value) => {
          const option: ColumnOption = {
            value: value,
            label: value,
            icon: undefined,
          }

          return option
        },
      )

  function handleOptionSelect(value: string, check: boolean) {
    if (check)
      column?.setFilterValue((old: undefined | FilterValue<'option'>) => {
        if (!old || old.values.length === 0)
          return {
            operator: 'is',
            values: [value],
          } satisfies FilterValue<'option'>

        const newValues = [...old.values, value]

        return {
          operator: 'is any of',
          values: newValues,
        } satisfies FilterValue<'option'>
      })
    else
      column?.setFilterValue((old: undefined | FilterValue<'option'>) => {
        if (!old || old.values.length <= 1) return undefined

        const newValues = old.values.filter((v) => v !== value)
        return {
          operator: newValues.length > 1 ? 'is any of' : 'is',
          values: newValues,
        } satisfies FilterValue<'option'>
      })
  }

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search..." />
      <CommandEmpty>No results.</CommandEmpty>
      <CommandList className="max-h-fit">
        <CommandGroup>
          {options.map((v) => {
            const checked = Boolean(filter?.values.includes(v.value))
            let data = table.getCoreRowModel().rows.map((r: Row<TData>) => {
              const original = r.original as Record<string, unknown>
              const value = original[id]
              return value
            })

            if (columnMeta.transformFn) {
              data = data.map(columnMeta.transformFn)
            }

            const count = data.filter((d) => d === v.value).length ?? 0

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
                        'ml-0.5 tabular-nums tracking-tight',
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

export function PropertyFilterMultiOptionValueMenu<TData, TValue>({
  id,
  column,
  columnMeta,
  table,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'multiOption'>)
    : undefined

  let options: ColumnOption[]

  if (columnMeta.options) {
    options = columnMeta.options
  } else if (columnMeta.transformFn) {
    const columnVals = table
      .getCoreRowModel()
      .rows.flatMap((r) => r.getValue(id))
    const transformed = columnVals.map(columnMeta.transformFn) as string[]
    // const flattened = flatten(transformed)
    // TODO: Do we need to flatten?
    const flattened = transformed
    const unique = uniq(flattened)
    options = unique.map((value) => {
      const option: ColumnOption = {
        value: value,
        label: value,
        icon: undefined,
      }
      return option
    })
  } else {
    const columnVals = table
      .getCoreRowModel()
      .rows.flatMap((r) => r.getValue<string[]>(id))
    const unique = uniq(columnVals)
    options = unique.map((value) => {
      const option: ColumnOption = {
        value: value,
        label: value,
        icon: undefined,
      }
      return option
    })
  }

  // Handles the selection/deselection of an option
  function handleOptionSelect(value: string, check: boolean) {
    if (check) {
      column.setFilterValue((old: undefined | FilterValue<'multiOption'>) => {
        if (
          !old ||
          old.values.length === 0 ||
          !old.values[0] ||
          old.values[0].length === 0
        )
          return {
            operator: 'include',
            values: [[value]],
          } satisfies FilterValue<'multiOption'>

        const newValues = [uniq([...old.values[0], value])]

        return {
          operator: determineNewOperator(
            'multiOption',
            old.values,
            newValues,
            old.operator,
          ),
          values: newValues,
        } satisfies FilterValue<'multiOption'>
      })
    } else
      column.setFilterValue((old: undefined | FilterValue<'multiOption'>) => {
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
        } satisfies FilterValue<'multiOption'>
      })
  }

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search..." />
      <CommandEmpty>No results.</CommandEmpty>
      <CommandList className="max-h-fit">
        <CommandGroup>
          {options.map((v) => {
            const checked = Boolean(filter?.values[0]?.includes(v.value))
            let data = table
              .getCoreRowModel()
              .rows.map((r) => r.original as Record<string, unknown>)
              .map((d) => d[id])

            if (columnMeta.transformFn) {
              data = data.map(columnMeta.transformFn)
            }

            const count =
              data.filter((d) => (d as unknown[]).includes(v.value)).length ?? 0

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
                        'ml-0.5 tabular-nums tracking-tight',
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
    ? (column.getFilterValue() as FilterValue<'date'>)
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

    column.setFilterValue((old: undefined | FilterValue<'date'>) => {
      if (!old || old.values.length === 0)
        return {
          operator: newValues.length > 1 ? 'is between' : 'is',
          values: newValues,
        } satisfies FilterValue<'date'>

      return {
        operator:
          old.values.length < newValues.length
            ? 'is between'
            : old.values.length > newValues.length
              ? 'is'
              : old.operator,
        values: newValues,
      } satisfies FilterValue<'date'>
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
    ? (column.getFilterValue() as FilterValue<'text'>)
    : undefined

  const changeText = (value: string | number) => {
    column.setFilterValue((old: undefined | FilterValue<'text'>) => {
      if (!old || old.values.length === 0)
        return {
          operator: 'contains',
          values: [String(value)],
        } satisfies FilterValue<'text'>
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
  column,
  columnMeta,
}: ProperFilterValueMenuProps<TData, TValue>) {
  const maxFromMeta = columnMeta.max
  const cappedMax = maxFromMeta ?? Number.POSITIVE_INFINITY

  const filter = column.getFilterValue()
    ? (column.getFilterValue() as FilterValue<'number'>)
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

    column.setFilterValue((old: undefined | FilterValue<'number'>) => {
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
    column.setFilterValue((old: undefined | FilterValue<'number'>) => {
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

  return (
    <Command className="w-[300px]">
      <CommandList>
        <CommandGroup>
          <CommandItem className="flex flex-col items-start gap-4 bg-transparent pt-4 data-[selected=true]:bg-transparent">
            {isNumberRange ? (
              <>
                <Slider
                  value={inputValues.map((val) =>
                    val === '' || val === `${cappedMax}+`
                      ? cappedMax
                      : Number.parseInt(val, 10),
                  )}
                  onValueChange={(value) => {
                    const values = value.map((val) =>
                      val >= cappedMax ? cappedMax : val,
                    )
                    setInputValues(
                      values.map((v) =>
                        v >= cappedMax ? `${cappedMax}+` : v.toString(),
                      ),
                    )
                    changeNumber(values)
                  }}
                  min={datasetMin}
                  max={cappedMax}
                  step={1}
                  aria-orientation="horizontal"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Min</span>
                    <Input
                      type="number"
                      value={inputValues[0]}
                      onChange={(e) => handleInputChange(0, e.target.value)}
                      max={cappedMax}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Max</span>
                    <Input
                      type="text"
                      value={inputValues[1]}
                      placeholder={`${cappedMax}+`}
                      onChange={(e) => handleInputChange(1, e.target.value)}
                      max={cappedMax}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex w-1/2 items-center gap-2">
                <span className="text-sm font-medium">Value</span>
                <Input
                  id="single"
                  type="number"
                  value={inputValues[0]}
                  onChange={(e) => handleInputChange(0, e.target.value)}
                  max={cappedMax}
                />
              </div>
            )}
          </CommandItem>
          <CommandSeparator className="my-4" />
          <CommandItem className="bg-transparent pb-3 pt-0  data-[selected=true]:bg-transparent">
            <div className="flex items-center gap-2">
              <Switch
                checked={isNumberRange}
                onCheckedChange={(checked) =>
                  changeType(checked ? 'range' : 'single')
                }
              />
              <Label className="font-normal">Range</Label>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
