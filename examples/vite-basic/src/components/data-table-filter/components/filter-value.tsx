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
import { isEqual } from 'date-fns'
import { format } from 'date-fns'
import { Ellipsis } from 'lucide-react'
import {
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { DateRange } from 'react-day-picker'
import { numberFilterDetails } from '../core/operators'
import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
} from '../core/types'
import { take } from '../lib/array'
import { DebouncedInput } from '../ui/debounced-input'

interface FilterValueProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
}

export const FilterValue = memo(__FilterValue) as typeof __FilterValue

function __FilterValue<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
}: FilterValueProps<TData, TType>) {
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
          strategy={strategy}
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
  strategy: FilterStrategy
}

export const FilterValueController = memo(
  __FilterValueController,
) as typeof __FilterValueController

function __FilterValueController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
}: FilterValueControllerProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionController
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          strategy={strategy}
        />
      )
    case 'multiOption':
      return (
        <FilterValueMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          strategy={strategy}
        />
      )
    case 'date':
      return (
        <FilterValueDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          strategy={strategy}
        />
      )
    case 'text':
      return (
        <FilterValueTextController
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          strategy={strategy}
        />
      )
    case 'number':
      return (
        <FilterValueNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          strategy={strategy}
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
  strategy,
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
            const count = optionsCount?.get(v.value) ?? 0

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
                        !optionsCount && 'hidden',
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
  strategy,
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
            const count = optionsCount?.get(v.value) ?? 0

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
                        !optionsCount && 'hidden',
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
    actions.setFilterValue(column, value)
  }

  const changeMinNumber = (value: number) => {
    const newValues = [value, values[1]]
    setValues(newValues)
    actions.setFilterValue(column, newValues)
  }

  const changeMaxNumber = (value: number) => {
    const newValues = [values[0], value]
    setValues(newValues)
    actions.setFilterValue(column, newValues)
  }

  const changeType = useCallback(
    (type: 'single' | 'range') => {
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
