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
import {
  getColumn,
  getColumnMeta,
} from '@/lib/table'
import type { Column, Table } from '@tanstack/react-table'
import { ArrowRight, Filter } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PropertyFilterValueMenu } from './property-filter-value'

export function TableFilter<TData>({ table }: { table: Table<TData> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [property, setProperty] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const column = property ? getColumn(table, property) : undefined
  const columnMeta = property ? getColumnMeta(table, property) : undefined

  const properties = table
    .getAllColumns()
    .filter((column) => column.getCanFilter())

  const hasFilters = table.getState().columnFilters.length > 0

  useEffect(() => {
    if (property && inputRef) {
      inputRef.current?.focus()
      setValue('')
    }
  }, [property])

  useEffect(() => {
    if (!open) setTimeout(() => setValue(''), 150)
  }, [open])

  const content = useMemo(
    () =>
      property && column && columnMeta ? (
        <PropertyFilterValueMenu
          id={property}
          column={column}
          columnMeta={columnMeta}
          table={table}
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
              {properties.map((column) => (
                <TableFilterMenuItem
                  key={column.id}
                  column={column}
                  table={table}
                  setProperty={setProperty}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      ),
    [property, column, columnMeta, value, table, properties],
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
        <Button variant="outline" className={cn('h-7', hasFilters && 'w-fit')}>
          <Filter className="size-4" />
          {!hasFilters && <span>Filter</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

export function TableFilterMenuItem<TData>({
  column,
  setProperty,
}: {
  column: Column<TData>
  table: Table<TData>
  setProperty: (value: string) => void
}) {
  const Icon = column.columnDef.meta?.icon!
  return (
    <CommandItem onSelect={() => setProperty(column.id)} className="group">
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          {<Icon strokeWidth={2.25} className="size-4" />}
          <span>{column.columnDef.meta?.displayName}</span>
        </div>
        <ArrowRight className="size-4 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  )
}
