/**********************************************************************************************************
 ***** Filter Functions ******
 **********************************************************************************************************
 * These are functions that filter data based on the current filter values, column data type, and operator.
 * There exists a separate filter function for each column data type.
 *
 * Two variants of the filter functions are provided - as an example, we will take the optionFilterFn:
 * 1. optionFilterFn: takes in a row, columnId, and filterValue.
 * 2. __optionFilterFn: takes in an inputData and filterValue.
 *
 * __optionFilterFn is a private function that is used by filterFn to perform the actual filtering.
 * *********************************************************************************************************/

import type { Row } from '@tanstack/react-table'
import {
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from 'date-fns'
import { intersection } from './array'
import {
  dateFilterDetails,
  isColumnOption,
  isColumnOptionArray,
  isStringArray,
} from './filters'
import type { ColumnDataType, FilterModel } from './filters.types'

/*
 * Returns a filter function for a given column data type.
 * This function is used to determine the appropriate filter function to use based on the column data type.
 */
export function filterFn(dataType: ColumnDataType) {
  switch (dataType) {
    // case 'option':
    //   return optionFilterFn
    // case 'multiOption':
    //   return multiOptionFilterFn
    case 'date':
      return dateFilterFn
    case 'text':
      return textFilterFn
    case 'number':
      return numberFilterFn
    default:
      throw new Error('Invalid column data type')
  }
}

// export function optionFilterFn<TData>(
//   row: Row<TData>,
//   columnId: string,
//   filterValue: FilterModel<'option'>,
// ) {
//   const value = row.getValue(columnId)

//   if (!value) return false

//   if (typeof value === 'string') {
//     return __optionFilterFn(value, filterValue)
//   }

//   if (isColumnOption(value)) {
//     return __optionFilterFn(value.value, filterValue)
//   }

//   const sanitizedValue = columnMeta.transformOptionFn!(value as never)
//   return __optionFilterFn(sanitizedValue.value, filterValue)
// }

export function __optionFilterFn<TData>(
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

// export function multiOptionFilterFn<TData>(
//   row: Row<TData>,
//   columnId: string,
//   filterValue: FilterModel<'multiOption'>,
// ) {
//   const value = row.getValue(columnId)

//   if (!value) return false

//   if (isStringArray(value)) {
//     return __multiOptionFilterFn(value, filterValue)
//   }

//   if (isColumnOptionArray(value)) {
//     return __multiOptionFilterFn(
//       value.map((v) => v.value),
//       filterValue,
//     )
//   }

//   const sanitizedValue = (value as never[]).map((v) =>
//     columnMeta.transformOptionFn!(v),
//   )

//   return __multiOptionFilterFn(
//     sanitizedValue.map((v) => v.value),
//     filterValue,
//   )
// }

export function __multiOptionFilterFn(
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

export function dateFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'date'>,
) {
  const value = row.getValue<Date>(columnId)

  return __dateFilterFn(value, filterValue)
}

export function __dateFilterFn<TData>(
  inputData: Date,
  filterValue: FilterModel<'date'>,
) {
  if (!filterValue || filterValue.values.length === 0) return true

  if (
    dateFilterDetails[filterValue.operator].target === 'single' &&
    filterValue.values.length > 1
  )
    throw new Error('Singular operators require at most one filter value')

  if (
    filterValue.operator in ['is between', 'is not between'] &&
    filterValue.values.length !== 2
  )
    throw new Error('Plural operators require two filter values')

  const filterVals = filterValue.values
  const d1 = filterVals[0]
  const d2 = filterVals[1]

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
        start: startOfDay(filterValue.values[0]),
        end: endOfDay(filterValue.values[1]),
      })
  }
}

export function textFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'text'>,
) {
  const value = row.getValue<string>(columnId) ?? ''

  return __textFilterFn(value, filterValue)
}

export function __textFilterFn<TData>(
  inputData: string,
  filterValue: FilterModel<'text'>,
) {
  if (!filterValue || filterValue.values.length === 0) return true

  const value = inputData.toLowerCase().trim()
  const filterStr = filterValue.values[0].toLowerCase().trim()

  if (filterStr === '') return true

  const found = value.includes(filterStr)

  switch (filterValue.operator) {
    case 'contains':
      return found
    case 'does not contain':
      return !found
  }
}

export function numberFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: FilterModel<'number'>,
) {
  const value = row.getValue<number>(columnId)

  return __numberFilterFn(value, filterValue)
}

export function __numberFilterFn<TData>(
  inputData: number,
  filterValue: FilterModel<'number'>,
) {
  if (!filterValue || !filterValue.values || filterValue.values.length === 0) {
    return true
  }

  const value = inputData
  const filterVal = filterValue.values[0]

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
      const lowerBound = filterValue.values[0]
      const upperBound = filterValue.values[1]
      return value >= lowerBound && value <= upperBound
    }
    case 'is not between': {
      const lowerBound = filterValue.values[0]
      const upperBound = filterValue.values[1]
      return value < lowerBound || value > upperBound
    }
    default:
      return true
  }
}
