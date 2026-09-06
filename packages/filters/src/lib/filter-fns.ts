import {
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from 'date-fns'
import { dateFilterOperators } from '../core/operators.js'
import type { FilterModel } from '../core/types.js'
import { intersection } from './array.js'
import { getValidBigInt, getValidNumber, isValidNumber } from './helpers.js'

export function optionFilterFn(
  inputData: string,
  filterValue: FilterModel<'option'>,
) {
  if (!inputData) return false
  if (filterValue.values.length === 0) return true

  const value = inputData.toString().toLowerCase()

  const found = !!filterValue.values.find((v) => v.toLowerCase() === value)

  switch (filterValue.operator) {
    case 'is':
    case 'is any of':
      return found
    case 'is not':
    case 'is none of':
      return !found
  }
}

export function multiOptionFilterFn(
  inputData: string[],
  filterValue: FilterModel<'multiOption'>,
) {
  if (!inputData) return false

  if (
    filterValue.values.length === 0 ||
    !filterValue.values[0] ||
    filterValue.values[0].length === 0
  )
    return true

  const values = inputData
  const filterValues = filterValue.values

  switch (filterValue.operator) {
    case 'include':
    case 'include any of':
      return intersection(values, filterValues).length > 0
    case 'exclude':
      return intersection(values, filterValues).length === 0
    case 'exclude if any of':
      return !(intersection(values, filterValues).length > 0)
    case 'include all of':
      return intersection(values, filterValues).length === filterValues.length
    case 'exclude if all':
      return !(
        intersection(values, filterValues).length === filterValues.length
      )
  }
}

export function dateFilterFn(
  inputData: Date,
  filterValue: FilterModel<'date'>,
) {
  if (!filterValue || filterValue.values.length === 0) return true

  if (
    dateFilterOperators[filterValue.operator].target === 'single' &&
    filterValue.values.length > 1
  )
    throw new Error('Singular operators require at most one filter value')

  if (
    filterValue.operator in ['is between', 'is not between'] &&
    filterValue.values.length !== 2
  )
    throw new Error('Plural operators require two filter values')

  const filterVals = filterValue.values
  const d1 = filterVals[0]!
  const d2 = filterVals[1]!

  const value = inputData

  switch (filterValue.operator) {
    case 'is':
      return isSameDay(value, d1)
    case 'is not':
      return !isSameDay(value, d1)
    case 'is before':
      return isBefore(value, startOfDay(d1))
    case 'is on or after':
      return isSameDay(value, d1) || isAfter(value, startOfDay(d1))
    case 'is after':
      return isAfter(value, startOfDay(d1))
    case 'is on or before':
      return isSameDay(value, d1) || isBefore(value, startOfDay(d1))
    case 'is between':
      return isWithinInterval(value, {
        start: startOfDay(d1),
        end: endOfDay(d2),
      })
    case 'is not between':
      return !isWithinInterval(value, {
        start: startOfDay(filterValue.values[0]!),
        end: endOfDay(filterValue.values[1]!),
      })
  }
}

export function textFilterFn(
  inputData: string,
  filterValue: FilterModel<'text'>,
) {
  if (!filterValue || filterValue.values.length === 0) return true

  const value = inputData.toLowerCase().trim()
  const filterStr = filterValue.values[0]!.toLowerCase().trim()

  if (filterStr === '') return true

  const found = value.includes(filterStr)

  switch (filterValue.operator) {
    case 'contains':
      return found
    case 'does not contain':
      return !found
  }
}

export function numberFilterFn(
  inputData: number,
  filterValue: FilterModel<'number'>,
): boolean {
  // Early exit conditions
  if (!filterValue?.values || filterValue.values.length === 0) {
    return true
  }

  const value = inputData
  const filterVal = getValidNumber(filterValue.values[0])

  // If the primary filter value is invalid, no filtering applies
  if (filterVal === undefined) {
    return true
  }

  // Input validation - if input data is not a valid number, handle appropriately
  if (!isValidNumber(value)) {
    // NaN input data never matches any filter (NaN !== NaN)
    return false
  }

  switch (filterValue.operator) {
    case 'is':
      return value === filterVal

    case 'is not':
      return value !== filterVal

    case 'is greater than':
      // Handle Infinity edge cases
      if (filterVal === Number.POSITIVE_INFINITY) return false // Nothing is greater than Infinity
      if (filterVal === Number.NEGATIVE_INFINITY) return true // Everything is greater than -Infinity
      return value > filterVal

    case 'is greater than or equal to':
      if (filterVal === Number.POSITIVE_INFINITY)
        return value === Number.POSITIVE_INFINITY // Only Infinity >= Infinity
      if (filterVal === Number.NEGATIVE_INFINITY) return true // Everything >= -Infinity
      return value >= filterVal

    case 'is less than':
      if (filterVal === Number.NEGATIVE_INFINITY) return false // Nothing is less than -Infinity
      if (filterVal === Number.POSITIVE_INFINITY)
        return value !== Number.POSITIVE_INFINITY // Everything except Infinity < Infinity
      return value < filterVal

    case 'is less than or equal to':
      if (filterVal === Number.NEGATIVE_INFINITY)
        return value === Number.NEGATIVE_INFINITY // Only -Infinity <= -Infinity
      if (filterVal === Number.POSITIVE_INFINITY) return true // Everything <= Infinity
      return value <= filterVal

    case 'is between': {
      const lowerBound = getValidNumber(filterValue.values[0])
      const upperBound = getValidNumber(filterValue.values[1])

      // If either bound is invalid, no filtering applies
      if (lowerBound === undefined || upperBound === undefined) {
        return true
      }

      // Handle the case where bounds might be reversed
      const actualLower = Math.min(lowerBound, upperBound)
      const actualUpper = Math.max(lowerBound, upperBound)

      // Special handling for infinite bounds
      if (
        actualLower === Number.NEGATIVE_INFINITY &&
        actualUpper === Number.POSITIVE_INFINITY
      ) {
        return true // Everything is between -∞ and +∞
      }
      if (
        actualLower === Number.POSITIVE_INFINITY ||
        actualUpper === Number.NEGATIVE_INFINITY
      ) {
        return false // Invalid range
      }

      return value >= actualLower && value <= actualUpper
    }

    case 'is not between': {
      const lowerBound = getValidNumber(filterValue.values[0])
      const upperBound = getValidNumber(filterValue.values[1])

      // If either bound is invalid, no filtering applies
      if (lowerBound === undefined || upperBound === undefined) {
        return true
      }

      // Handle the case where bounds might be reversed
      const actualLower = Math.min(lowerBound, upperBound)
      const actualUpper = Math.max(lowerBound, upperBound)

      // Special handling for infinite bounds
      if (
        actualLower === Number.NEGATIVE_INFINITY &&
        actualUpper === Number.POSITIVE_INFINITY
      ) {
        return false // Nothing is outside -∞ to +∞
      }
      if (
        actualLower === Number.POSITIVE_INFINITY ||
        actualUpper === Number.NEGATIVE_INFINITY
      ) {
        return true // Invalid range means everything is "not between"
      }

      return value < actualLower || value > actualUpper
    }

    default:
      return true
  }
}

export function bigIntFilterFn(
  inputData: bigint,
  filterValue: FilterModel<'bigint'>,
): boolean {
  // Early exit conditions
  if (!filterValue?.values || filterValue.values.length === 0) {
    return true
  }

  const value = inputData
  const filterVal = getValidBigInt(filterValue.values[0])

  if (filterVal === undefined) {
    return true
  }

  if (typeof value !== 'bigint') {
    return false
  }

  switch (filterValue.operator) {
    case 'is':
      return value === filterVal

    case 'is not':
      return value !== filterVal

    case 'is greater than':
      return value > filterVal

    case 'is greater than or equal to':
      return value >= filterVal

    case 'is less than':
      return value < filterVal

    case 'is less than or equal to':
      return value <= filterVal

    case 'is between': {
      const lowerBound = getValidBigInt(filterValue.values[0])
      const upperBound = getValidBigInt(filterValue.values[1])

      if (lowerBound === undefined || upperBound === undefined) {
        return true
      }

      const actualLower = lowerBound < upperBound ? lowerBound : upperBound
      const actualUpper = lowerBound < upperBound ? upperBound : lowerBound

      return value >= actualLower && value <= actualUpper
    }

    case 'is not between': {
      const lowerBound = getValidBigInt(filterValue.values[0])
      const upperBound = getValidBigInt(filterValue.values[1])

      if (lowerBound === undefined || upperBound === undefined) {
        return true
      }

      const actualLower = lowerBound < upperBound ? lowerBound : upperBound
      const actualUpper = lowerBound < upperBound ? upperBound : lowerBound

      return value < actualLower || value > actualUpper
    }

    default:
      return true
  }
}

export function booleanFilterFn(
  inputData: boolean,
  filterValue: FilterModel<'boolean'>,
) {
  if (!filterValue || filterValue.values.length === 0) return true

  if (filterValue.values.some((v) => typeof v === 'undefined'))
    throw new Error('Cannot create boolean filter value from undefined values')

  const value = inputData
  const filterVal = filterValue.values[0] ?? false

  switch (filterValue.operator) {
    case 'is':
      return value === filterVal
    case 'is not':
      return value !== filterVal
    default:
      return true
  }
}
