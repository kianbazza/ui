'use client'

import { CodeBlock } from '@/components/code-block'
import type { FiltersState } from '@/registry/data-table-filter-v2/lib/filters.types'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { IssuesTable } from './_/issues-table'

const filtersSchema = z.custom<FiltersState>()

export default function SSRPage() {
  const [filters, setFilters] = useQueryState<FiltersState>(
    'filters',
    parseAsJson(filtersSchema.parse).withDefault([]),
  )

  return (
    <div className="p-16 flex flex-col gap-8">
      <h1 className="text-4xl font-[538] tracking-[-0.03rem]">
        Server-side filtering{' '}
        <span className="text-muted-foreground">(TanStack Query + nuqs)</span>
      </h1>
      <div className="grid grid-cols-3 gap-8">
        <CodeBlock lang="json" code={JSON.stringify(filters, null, '\t')} />
        <IssuesTable state={{ filters, setFilters }} />
      </div>
    </div>
  )
}
