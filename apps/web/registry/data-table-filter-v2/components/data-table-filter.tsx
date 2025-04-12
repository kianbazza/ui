'use client'

import { useIsMobile } from '@/hooks/use-mobile'
import type {
  Column,
  DataTableFilterActions,
  FilterStrategy,
  FiltersState,
} from '../core/types'
import { ActiveFilters, ActiveFiltersMobileContainer } from './active-filters'
import { FilterActions } from './filter-actions'
import { FilterSelector } from './filter-selector'

interface DataTableFilterProps<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
}

export function DataTableFilter<TData>({
  columns,
  filters,
  actions,
  strategy,
}: DataTableFilterProps<TData>) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return (
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex gap-1">
          <FilterSelector
            columns={columns}
            filters={filters}
            actions={actions}
            strategy={strategy}
          />
          <FilterActions hasFilters={filters.length > 0} actions={actions} />
        </div>
        <ActiveFiltersMobileContainer>
          <ActiveFilters
            columns={columns}
            filters={filters}
            actions={actions}
            strategy={strategy}
          />
        </ActiveFiltersMobileContainer>
      </div>
    )
  }

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex md:flex-wrap gap-2 w-full flex-1">
        <FilterSelector
          columns={columns}
          filters={filters}
          actions={actions}
          strategy={strategy}
        />
        <ActiveFilters
          columns={columns}
          filters={filters}
          actions={actions}
          strategy={strategy}
        />
      </div>
      <FilterActions hasFilters={filters.length > 0} actions={actions} />
    </div>
  )
}
