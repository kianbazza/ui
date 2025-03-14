import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Table } from '@tanstack/react-table'
import { FilterX } from 'lucide-react'

export function TableFilterActions<TData>({ table }: { table: Table<TData> }) {
  const hasFilters = table.getState().columnFilters.length > 0

  function clearFilters() {
    table.setColumnFilters([])
    table.setGlobalFilter('')
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 w-fit border-red-600 px-2 font-normal text-red-600 hover:bg-red-600/10 hover:text-red-600',
              !hasFilters && 'hidden',
            )}
            onClick={clearFilters}
          >
            <FilterX className="size-4" />
            <span className="ml-1 whitespace-nowrap">Clear</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear all filters</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
