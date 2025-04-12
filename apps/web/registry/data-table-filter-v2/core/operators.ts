import type {
  ColumnDataType,
  FilterDetails,
  FilterOperatorTarget,
  FilterOperators,
  FilterTypeOperatorDetails,
  FilterValues,
} from './types'

export const DEFAULT_OPERATORS: Record<
  ColumnDataType,
  Record<FilterOperatorTarget, FilterOperators[ColumnDataType]>
> = {
  text: {
    single: 'contains',
    multiple: 'contains',
  },
  number: {
    single: 'is',
    multiple: 'is between',
  },
  date: {
    single: 'is',
    multiple: 'is between',
  },
  option: {
    single: 'is',
    multiple: 'is any of',
  },
  multiOption: {
    single: 'include',
    multiple: 'include any of',
  },
}

/* Details for all the filter operators for option data type */
export const optionFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is any of',
    relativeOf: 'is not',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is none of',
    relativeOf: 'is',
    isNegated: true,
    negationOf: 'is',
  },
  'is any of': {
    label: 'is any of',
    value: 'is any of',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is none of',
    isNegated: false,
    negation: 'is none of',
  },
  'is none of': {
    label: 'is none of',
    value: 'is none of',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is any of',
    isNegated: true,
    negationOf: 'is any of',
  },
} as const satisfies FilterDetails<'option'>

/* Details for all the filter operators for multi-option data type */
export const multiOptionFilterDetails = {
  include: {
    label: 'include',
    value: 'include',
    target: 'single',
    singularOf: 'include any of',
    relativeOf: 'exclude',
    isNegated: false,
    negation: 'exclude',
  },
  exclude: {
    label: 'exclude',
    value: 'exclude',
    target: 'single',
    singularOf: 'exclude if any of',
    relativeOf: 'include',
    isNegated: true,
    negationOf: 'include',
  },
  'include any of': {
    label: 'include any of',
    value: 'include any of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['exclude if all', 'include all of', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if all',
  },
  'exclude if all': {
    label: 'exclude if all',
    value: 'exclude if all',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'include all of', 'exclude if any of'],
    isNegated: true,
    negationOf: 'include any of',
  },
  'include all of': {
    label: 'include all of',
    value: 'include all of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['include any of', 'exclude if all', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if any of',
  },
  'exclude if any of': {
    label: 'exclude if any of',
    value: 'exclude if any of',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'exclude if all', 'include all of'],
    isNegated: true,
    negationOf: 'include all of',
  },
} as const satisfies FilterDetails<'multiOption'>

/* Details for all the filter operators for date data type */
export const dateFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: 'is after',
    isNegated: false,
    negation: 'is before',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: [
      'is',
      'is before',
      'is on or after',
      'is after',
      'is on or before',
    ],
    isNegated: true,
    negationOf: 'is',
  },
  'is before': {
    label: 'is before',
    value: 'is before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is on or after',
      'is after',
      'is on or before',
    ],
    isNegated: false,
    negation: 'is on or after',
  },
  'is on or after': {
    label: 'is on or after',
    value: 'is on or after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is before', 'is after', 'is on or before'],
    isNegated: false,
    negation: 'is before',
  },
  'is after': {
    label: 'is after',
    value: 'is after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is before',
      'is on or after',
      'is on or before',
    ],
    isNegated: false,
    negation: 'is on or before',
  },
  'is on or before': {
    label: 'is on or before',
    value: 'is on or before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: ['is', 'is not', 'is after', 'is on or after', 'is before'],
    isNegated: false,
    negation: 'is after',
  },
  'is between': {
    label: 'is between',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'date'>

/* Details for all the filter operators for text data type */
export const textFilterDetails = {
  contains: {
    label: 'contains',
    value: 'contains',
    target: 'single',
    relativeOf: 'does not contain',
    isNegated: false,
    negation: 'does not contain',
  },
  'does not contain': {
    label: 'does not contain',
    value: 'does not contain',
    target: 'single',
    relativeOf: 'contains',
    isNegated: true,
    negationOf: 'contains',
  },
} as const satisfies FilterDetails<'text'>

/* Details for all the filter operators for number data type */
export const numberFilterDetails = {
  is: {
    label: 'is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    label: 'is not',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: [
      'is',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: true,
    negationOf: 'is',
  },
  'is greater than': {
    label: '>',
    value: 'is greater than',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is greater than or equal to': {
    label: '>=',
    value: 'is greater than or equal to',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is less than': {
    label: '<',
    value: 'is less than',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than',
  },
  'is less than or equal to': {
    label: '<=',
    value: 'is less than or equal to',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than or equal to',
  },
  'is between': {
    label: 'is between',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    label: 'is not between',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'number'>

export const filterTypeOperatorDetails: FilterTypeOperatorDetails = {
  text: textFilterDetails,
  number: numberFilterDetails,
  date: dateFilterDetails,
  option: optionFilterDetails,
  multiOption: multiOptionFilterDetails,
}

/*
 *
 * Determines the new operator for a filter based on the current operator, old and new filter values.
 *
 * This handles cases where the filter values have transitioned from a single value to multiple values (or vice versa),
 * and the current operator needs to be transitioned to its plural form (or singular form).
 *
 * For example, if the current operator is 'is', and the new filter values have a length of 2, the
 * new operator would be 'is any of'.
 *
 */
export function determineNewOperator<TType extends ColumnDataType>(
  type: TType,
  oldVals: FilterValues<TType>,
  nextVals: FilterValues<TType>,
  currentOperator: FilterOperators[TType],
): FilterOperators[TType] {
  const a =
    Array.isArray(oldVals) && Array.isArray(oldVals[0])
      ? oldVals[0].length
      : oldVals.length
  const b =
    Array.isArray(nextVals) && Array.isArray(nextVals[0])
      ? nextVals[0].length
      : nextVals.length

  // If filter size has not transitioned from single to multiple (or vice versa)
  // or is unchanged, return the current operator.
  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1))
    return currentOperator

  const opDetails = filterTypeOperatorDetails[type][currentOperator]

  // Handle transition from single to multiple filter values.
  if (a < b && b >= 2) return opDetails.singularOf ?? currentOperator
  // Handle transition from multiple to single filter values.
  if (a > b && b <= 1) return opDetails.pluralOf ?? currentOperator
  return currentOperator
}
