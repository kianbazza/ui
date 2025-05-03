import { act, renderHook } from '@testing-library/react'
import { CircleIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { createColumnConfigHelper } from '../core/filters'
import { DEFAULT_OPERATORS, determineNewOperator } from '../core/operators'
import { useDataTableFilters } from '../hooks/use-data-table-filters'

// Dummy icon component for column configuration
const DummyIcon = CircleIcon

// Define a dummy data type used for testing.
type TestData = {
  name: string
  status: string
}

// Sample data and column configurations.
const data: TestData[] = [
  { name: 'John', status: 'active' },
  { name: 'Jane', status: 'inactive' },
]

const helper = createColumnConfigHelper<TestData>()

const optionColumn = helper
  .option()
  .accessor((row) => row.status)
  .id('status')
  .displayName('Status')
  .icon(DummyIcon)
  .build()
const textColumn = helper
  .text()
  .accessor((row) => row.name)
  .id('name')
  .displayName('Name')
  .icon(DummyIcon)
  .build()

const columnsConfig = [optionColumn, textColumn] as const

// For option columns, supply static options that the hook uses.
const options = {
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
}

describe('useDataTableFilters', () => {
  it('should add an option filter value via addFilterValue', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Initially, no filters exist.
    expect(result.current.filters).toHaveLength(0)

    // Add a filter value for the option column.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
    })

    expect(result.current.filters).toHaveLength(1)
    const filter = result.current.filters[0]
    expect(filter.columnId).toBe('status')
    expect(filter.values).toEqual(['active'])
    // For an option column with a single value, the default operator is expected to be "single".
    expect(filter.operator).toBe(DEFAULT_OPERATORS.option.single)
  })

  it('should update an existing option filter when adding new values', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Start by adding a single filter value.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
    })
    // Adding the same value again should not result in duplicates.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.filters[0].values).toEqual(['active'])

    // Add a different value.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['inactive'])
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.filters[0].values).toEqual(['active', 'inactive'])
    // Multiple selected values should cause the operator to switch to "multiple".
    expect(result.current.filters[0].operator).toBe(
      DEFAULT_OPERATORS.option.multiple,
    )
  })

  it('should remove an option filter value using removeFilterValue', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Add two filter values.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, [
        'active',
        'inactive',
      ])
    })
    expect(result.current.filters[0].values).toEqual(['active', 'inactive'])

    // Remove one value.
    act(() => {
      result.current.actions.removeFilterValue(optionColumn as any, ['active'])
    })
    expect(result.current.filters[0].values).toEqual(['inactive'])

    // Remove the last value; the filter should then be removed.
    act(() => {
      result.current.actions.removeFilterValue(optionColumn as any, [
        'inactive',
      ])
    })
    expect(result.current.filters).toHaveLength(0)
  })

  it('should set a text filter value using setFilterValue', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
      }),
    )

    // Set a filter for the text column.
    act(() => {
      result.current.actions.setFilterValue(textColumn as any, ['John'])
    })
    expect(result.current.filters).toHaveLength(1)
    const textFilter = result.current.filters.find((f) => f.columnId === 'name')
    expect(textFilter).toBeDefined()
    expect(textFilter!.values).toEqual(['John'])
    // The default operator for text columns should be "contains" (as defined in DEFAULT_OPERATORS).
    expect(textFilter!.operator).toBe(DEFAULT_OPERATORS.text.single)
  })

  it('should update the filter operator using setFilterOperator', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
      }),
    )

    // First, set a filter for the text column.
    act(() => {
      result.current.actions.setFilterValue(textColumn as any, ['Jane'])
    })
    let filter = result.current.filters.find((f) => f.columnId === 'name')
    expect(filter).toBeDefined()
    expect(filter!.operator).toBe(DEFAULT_OPERATORS.text.single)

    // Update the operator explicitly.
    act(() => {
      result.current.actions.setFilterOperator('name', 'does not contain')
    })
    filter = result.current.filters.find((f) => f.columnId === 'name')
    expect(filter).toBeDefined()
    expect(filter!.operator).toBe('does not contain')
  })

  it('should remove a filter using removeFilter', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Add filters for both the option and text columns.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
      result.current.actions.setFilterValue(textColumn as any, ['John'])
    })
    expect(result.current.filters).toHaveLength(2)

    // Remove the text filter.
    act(() => {
      result.current.actions.removeFilter('name')
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.filters[0].columnId).toBe('status')
  })

  it('should remove all filters using removeAllFilters', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Add multiple filters.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
      result.current.actions.setFilterValue(textColumn as any, ['Jane'])
    })
    expect(result.current.filters).toHaveLength(2)

    // Remove all filters.
    act(() => {
      result.current.actions.removeAllFilters()
    })
    expect(result.current.filters).toHaveLength(0)
  })

  it('should use the default filters state if provided', () => {
    const defaultFilters = [
      {
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      },
      {
        columnId: 'name',
        type: 'text',
        operator: 'contains',
        values: ['John'],
      },
    ]

    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
        defaultFilters,
      }),
    )

    expect(result.current.filters).toHaveLength(2)
    expect(result.current.filters[0]).toEqual(defaultFilters[0])
    expect(result.current.filters[1]).toEqual(defaultFilters[1])
  })
})

describe('determineNewOperator function', () => {
  it('should return the same operator when the number of values does not change', () => {
    const newOp = determineNewOperator('text', ['foo'], ['bar'], 'contains')
    expect(newOp).toBe('contains')
  })

  it('should switch to the multiple value operator when transitioning from a single value to multiple values', () => {
    // For an option column, "is" should transition to "is any of" when there is more than one value.
    const newOp = determineNewOperator('option', ['a'], ['a', 'b'], 'is')
    expect(newOp).toBe('is any of')
  })

  it('should switch to the single value operator when transitioning from multiple values to a single value', () => {
    // For a number column using a range operator, transitioning from two values to a single value
    // should update from "is between" to "is".
    const newOp = determineNewOperator('number', [5, 10], [5], 'is between')
    expect(newOp).toBe('is')
  })
})
