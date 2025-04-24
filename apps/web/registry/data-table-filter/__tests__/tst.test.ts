// Tests for the TanStack Table integration

import type { ColumnDef } from '@tanstack/react-table'
import { renderHook } from '@testing-library/react'
import { CircleIcon } from 'lucide-react'
import { describe } from 'vitest'
import { createColumnConfigHelper } from '../core/filters'
import { useDataTableFilters } from '../hooks/use-data-table-filters'
import { createTSTColumns } from '../integrations/tanstack-table'

// Dummy icon component for column configuration
const DummyIcon = CircleIcon

// Define a dummy data type used for testing.
type Person = {
  name: string
  age: number
  salary: number
  university: string
}

const helper = createColumnConfigHelper<Person>()

const columnsConfig = [
  helper
    .text()
    .accessor((row) => row.name)
    .id('name')
    .displayName('Name')
    .icon(DummyIcon)
    .build(),
  helper
    .number()
    .accessor((row) => row.age)
    .id('age')
    .displayName('Age')
    .icon(DummyIcon)
    .build(),
  helper
    .number()
    .accessor((row) => row.salary)
    .id('salary')
    .displayName('Salary')
    .icon(DummyIcon)
    .build(),
] as const

const columnDefs: ColumnDef<Person>[] = [
  {
    id: 'name',
    accessorKey: 'name',
  },
  {
    id: 'age',
    accessorKey: 'age',
    enableColumnFilter: true,
  },
  {
    id: 'salary',
    accessorKey: 'salary',
    enableColumnFilter: false,
  },
  {
    id: 'university',
    accessorKey: 'university',
    enableColumnFilter: true,
  },
]

describe('Integration: TanStack Table', () => {
  describe('createTSTColumns', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data: [] as Person[],
        columnsConfig,
      }),
    )

    const tstColumns = createTSTColumns({
      columns: columnDefs,
      configs: result.current.columns,
    })

    it('should consider columns when enableColumnnFilter is not explicitly set', () => {
      expect(tstColumns[0].filterFn).toBeDefined()
    })

    it('should consider columns when enableColumnnFilter is explicitly set to true', () => {
      expect(tstColumns[1].filterFn).toBeDefined()
    })

    it('should not consider columns when enableColumnnFilter is explicitly set to false', () => {
      expect(tstColumns[2].filterFn).toBeUndefined()
    })

    it('should not consider columns when a matching column config is not found', () => {
      expect(tstColumns[3].filterFn).toBeUndefined()
    })
  })
})
