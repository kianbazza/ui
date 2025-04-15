'use client'

import { CodeBlock } from '@/components/code-block'
import { NavBar } from '@/components/nav-bar'
import type { FiltersState } from '@/registry/data-table-filter/core/types'
import { useState } from 'react'
import { IssuesTable } from './_/issues-table'

export default function SSRPage() {
  const [filters, setFilters] = useState<FiltersState>([])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border border-dashed sticky top-0 bg-site-background backdrop-blur-md z-50">
        <div className="px-4 py-2 max-w-screen-xl w-full mx-auto border-border border-dashed xl:border-x">
          <NavBar />
        </div>
      </div>
      <div className="border-b border-border border-dashed bg-site-background">
        <div className="px-4 py-2 max-w-screen-2xl w-full mx-auto border-border border-dashed xl:border-x">
          <div className="flex flex-col gap-8 p-8">
            <h1 className="text-4xl font-[538] tracking-[-0.03rem] select-none">
              Client-side filtering{' '}
              <span className="text-muted-foreground">(TanStack Table)</span>
            </h1>
            <div className="grid grid-cols-3 gap-8">
              <CodeBlock
                lang="json"
                code={JSON.stringify(filters, null, '\t')}
              />
              <IssuesTable state={{ filters, setFilters }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
