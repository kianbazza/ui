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
import { cn } from '@/lib/utils'
import { ArrowRightIcon, FilterIcon } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
} from '../core/types'
import { getColumn } from '../lib/helpers'
import { type Locale, t } from '../lib/i18n'
import { FilterValueController } from './filter-value'

interface FilterSelectorProps<TData> {
  filters: FiltersState
  columns: Column<TData>[]
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}

export const FilterSelector = memo(__FilterSelector) as typeof __FilterSelector

function __FilterSelector<TData>({
  filters,
  columns,
  actions,
  strategy,
  locale = 'en',
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
          strategy={strategy}
          locale={locale}
        />
      ) : (
        <Command loop>
          <CommandInput
            value={value}
            onValueChange={setValue}
            ref={inputRef}
            placeholder={t('search', locale)}
          />
          <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
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
          <FilterIcon className="size-4" />
          {!hasFilters && <span>{t('filter', locale)}</span>}
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
        <ArrowRightIcon className="size-4 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  )
}
