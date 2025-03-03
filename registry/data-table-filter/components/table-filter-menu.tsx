'use client'

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
import type { Column, Table } from '@tanstack/react-table'
import { ArrowRight, Filter } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PropertyFilterValueMenu } from './property-filter-value'

export function TableFilter<TData>({ table }: { table: Table<TData> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [property, setProperty] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const properties = table
    .getAllColumns()
    .filter((column) => column.getCanFilter())

  const hasFilters = table.getState().columnFilters.length > 0

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const isInputFocused = () => {
      const activeElement = document.activeElement
      return (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA')
      )
    }

    const down = (e: KeyboardEvent) => {
      /*
       * Open the filter menu when the user presses the "F" key
       *
       * Ensures:
       * 1) the menu is not already open
       * 2) there are not focused inputs (eg. user is not typing elsewhere)
       */
      if (!open && e.key === 'f' && !isInputFocused()) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    // Add the listener to the document
    document.addEventListener('keydown', down)

    // On component unmount, remove the listener
    return () => document.removeEventListener('keydown', down)
  }, [setOpen, open])

  useEffect(() => {
    if (property && inputRef) {
      inputRef.current?.focus()
      setValue('')
    }
  }, [property])

  useEffect(() => {
    if (!open) setTimeout(() => setValue(''), 150)
  }, [open])

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
          size="sm"
          className={cn('h-7 font-normal', hasFilters && 'w-fit px-2')}
        >
          <Filter className="size-4" />
          {!hasFilters && <span className="ml-1.5">Filter</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit p-0">
        {!property && (
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
        )}
        {property && <PropertyFilterValueMenu id={property} table={table} />}
      </PopoverContent>
    </Popover>
  )
}

export function TableFilterMenuItem<TData>({
  column,
  table,
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
          <span className="text-slate-600">
            {column.columnDef.meta?.displayName}
          </span>
        </div>
        <ArrowRight className="size-4 text-slate-600 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  )
}
