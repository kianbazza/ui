import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FilterXIcon } from 'lucide-react'
import { memo } from 'react'
import type { DataTableFilterActions } from '../core/types'

interface FilterActionsProps {
  hasFilters: boolean
  actions?: DataTableFilterActions
}

export const FilterActions = memo(__FilterActions)
function __FilterActions({ hasFilters, actions }: FilterActionsProps) {
  return (
    <Button
      className={cn('h-7 !px-2', !hasFilters && 'hidden')}
      variant="destructive"
      onClick={actions?.removeAllFilters}
    >
      <FilterXIcon />
      <span className="hidden md:block">Clear</span>
    </Button>
  )
}
