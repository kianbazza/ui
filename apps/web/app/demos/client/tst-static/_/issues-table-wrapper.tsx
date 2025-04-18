'use client'

import type { FiltersState } from '@/registry/data-table-filter/core/types'
import { useState } from 'react'
import { IssuesTable } from './issues-table'

export function IssuesTableWrapper() {
  const [filters, setFilters] = useState<FiltersState>([])

  return <IssuesTable state={{ filters, setFilters }} />
}
