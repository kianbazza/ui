'use client'

import { ActiveFilters } from '@/registry/data-table-filter-v2/components/active-filters'
import { FilterActions } from '@/registry/data-table-filter-v2/components/filter-actions'
import { FilterSelector } from '@/registry/data-table-filter-v2/components/filter-selector'
import type {
  Column,
  DataTableFilterActions,
  FiltersState,
} from '@/registry/data-table-filter-v2/core/types'

interface DataTableFilterProps<TData> {
  columns: Column<TData>[]
  filters: FiltersState
  actions: DataTableFilterActions
}

export function DataTableFilter<TData>({
  columns,
  filters,
  actions,
}: DataTableFilterProps<TData>) {
  // const isMobile = useIsMobile()
  // if (isMobile) {
  //   return (
  //     <div className="flex w-full items-start justify-between gap-2">
  //       <div className="flex gap-1">
  //         <FilterSelector
  //           filters={filters}
  //           columns={columns}
  //           actions={actions}
  //         />
  //         <FilterActions filters={filters} actions={actions} />
  //       </div>
  //       <ActiveFiltersMobileContainer>
  //         <ActiveFilters
  //           columns={columns}
  //           filters={filters}
  //           actions={actions}
  //         />
  //       </ActiveFiltersMobileContainer>
  //     </div>
  //   )
  // }

  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex md:flex-wrap gap-2 w-full flex-1">
        <FilterSelector columns={columns} filters={filters} actions={actions} />
        <ActiveFilters columns={columns} filters={filters} actions={actions} />
      </div>
      <FilterActions hasFilters={filters.length > 0} actions={actions} />
    </div>
  )
}
