import { type Locale, t } from '../lib/i18n'
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
export function getOptionFilterDetails(locale: Locale) {
  return {
    is: {
      key: 'filters.option.is',
      label: t('filters.option.is', locale),
      value: 'is',
      target: 'single',
      singularOf: 'is any of',
      relativeOf: 'is not',
      isNegated: false,
      negation: 'is not',
    },
    'is not': {
      key: 'filters.option.isNot',
      label: t('filters.option.isNot', locale),
      value: 'is not',
      target: 'single',
      singularOf: 'is none of',
      relativeOf: 'is',
      isNegated: true,
      negationOf: 'is',
    },
    'is any of': {
      key: 'filters.option.isAnyOf',
      label: t('filters.option.isAnyOf', locale),
      value: 'is any of',
      target: 'multiple',
      pluralOf: 'is',
      relativeOf: 'is none of',
      isNegated: false,
      negation: 'is none of',
    },
    'is none of': {
      key: 'filters.option.isNoneOf',
      label: t('filters.option.isNoneOf', locale),
      value: 'is none of',
      target: 'multiple',
      pluralOf: 'is not',
      relativeOf: 'is any of',
      isNegated: true,
      negationOf: 'is any of',
    },
  } as const satisfies FilterDetails<'option'>
}

/* Details for all the filter operators for multi-option data type */
export function getMultiOptionFilterDetails(locale: Locale) {
  return {
    include: {
      key: 'filters.multiOption.include',
      label: t('filters.multiOption.include', locale),
      value: 'include',
      target: 'single',
      singularOf: 'include any of',
      relativeOf: 'exclude',
      isNegated: false,
      negation: 'exclude',
    },
    exclude: {
      key: 'filters.multiOption.exclude',
      label: t('filters.multiOption.exclude', locale),
      value: 'exclude',
      target: 'single',
      singularOf: 'exclude if any of',
      relativeOf: 'include',
      isNegated: true,
      negationOf: 'include',
    },
    'include any of': {
      key: 'filters.multiOption.includeAnyOf',
      label: t('filters.multiOption.includeAnyOf', locale),
      value: 'include any of',
      target: 'multiple',
      pluralOf: 'include',
      relativeOf: ['exclude if all', 'include all of', 'exclude if any of'],
      isNegated: false,
      negation: 'exclude if all',
    },
    'exclude if all': {
      key: 'filters.multiOption.excludeIfAll',
      label: t('filters.multiOption.excludeIfAll', locale),
      value: 'exclude if all',
      target: 'multiple',
      pluralOf: 'exclude',
      relativeOf: ['include any of', 'include all of', 'exclude if any of'],
      isNegated: true,
      negationOf: 'include any of',
    },
    'include all of': {
      key: 'filters.multiOption.includeAllOf',
      label: t('filters.multiOption.includeAllOf', locale),
      value: 'include all of',
      target: 'multiple',
      pluralOf: 'include',
      relativeOf: ['include any of', 'exclude if all', 'exclude if any of'],
      isNegated: false,
      negation: 'exclude if any of',
    },
    'exclude if any of': {
      key: 'filters.multiOption.excludeIfAnyOf',
      label: t('filters.multiOption.excludeIfAnyOf', locale),
      value: 'exclude if any of',
      target: 'multiple',
      pluralOf: 'exclude',
      relativeOf: ['include any of', 'exclude if all', 'include all of'],
      isNegated: true,
      negationOf: 'include all of',
    },
  } as const satisfies FilterDetails<'multiOption'>
}

/* Details for all the filter operators for date data type */
export function getDateFilterDetails(locale: Locale) {
  return {
    is: {
      key: 'filters.date.is',
      label: t('filters.date.is', locale),
      value: 'is',
      target: 'single',
      singularOf: 'is between',
      relativeOf: 'is after',
      isNegated: false,
      negation: 'is before',
    },
    'is not': {
      key: 'filters.date.isNot',
      label: t('filters.date.isNot', locale),
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
      key: 'filters.date.isBefore',
      label: t('filters.date.isBefore', locale),
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
      key: 'filters.date.isOnOrAfter',
      label: t('filters.date.isOnOrAfter', locale),
      value: 'is on or after',
      target: 'single',
      singularOf: 'is between',
      relativeOf: ['is', 'is not', 'is before', 'is after', 'is on or before'],
      isNegated: false,
      negation: 'is before',
    },
    'is after': {
      key: 'filters.date.isAfter',
      label: t('filters.date.isAfter', locale),
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
      key: 'filters.date.isOnOrBefore',
      label: t('filters.date.isOnOrBefore', locale),
      value: 'is on or before',
      target: 'single',
      singularOf: 'is between',
      relativeOf: ['is', 'is not', 'is after', 'is on or after', 'is before'],
      isNegated: false,
      negation: 'is after',
    },
    'is between': {
      key: 'filters.date.isBetween',
      label: t('filters.date.isBetween', locale),
      value: 'is between',
      target: 'multiple',
      pluralOf: 'is',
      relativeOf: 'is not between',
      isNegated: false,
      negation: 'is not between',
    },
    'is not between': {
      key: 'filters.date.isNotBetween',
      label: t('filters.date.isNotBetween', locale),
      value: 'is not between',
      target: 'multiple',
      pluralOf: 'is not',
      relativeOf: 'is between',
      isNegated: true,
      negationOf: 'is between',
    },
  } as const satisfies FilterDetails<'date'>
}

/* Details for all the filter operators for text data type */
export function getTextFilterDetails(locale: Locale) {
  return {
    contains: {
      key: 'filters.text.contains',
      label: t('filters.text.contains', locale),
      value: 'contains',
      target: 'single',
      relativeOf: 'does not contain',
      isNegated: false,
      negation: 'does not contain',
    },
    'does not contain': {
      key: 'filters.text.doesNotContain',
      label: t('filters.text.doesNotContain', locale),
      value: 'does not contain',
      target: 'single',
      relativeOf: 'contains',
      isNegated: true,
      negationOf: 'contains',
    },
  } as const satisfies FilterDetails<'text'>
}

/* Details for all the filter operators for number data type */
export function getNumberFilterDetails(locale: Locale) {
  return {
    is: {
      key: 'filters.number.is',
      label: t('filters.number.is', locale),
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
      key: 'filters.number.isNot',
      label: t('filters.number.isNot', locale),
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
      key: 'filters.number.greaterThan',
      label: t('filters.number.greaterThan', locale),
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
      key: 'filters.number.greaterThanOrEqual',
      label: t('filters.number.greaterThanOrEqual', locale),
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
      key: 'filters.number.lessThan',
      label: t('filters.number.lessThan', locale),
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
      key: 'filters.number.lessThanOrEqual',
      label: t('filters.number.lessThanOrEqual', locale),
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
      key: 'filters.number.isBetween',
      label: t('filters.number.isBetween', locale),
      value: 'is between',
      target: 'multiple',
      pluralOf: 'is',
      relativeOf: 'is not between',
      isNegated: false,
      negation: 'is not between',
    },
    'is not between': {
      key: 'filters.number.isNotBetween',
      label: t('filters.number.isNotBetween', locale),
      value: 'is not between',
      target: 'multiple',
      pluralOf: 'is not',
      relativeOf: 'is between',
      isNegated: true,
      negationOf: 'is between',
    },
  } as const satisfies FilterDetails<'number'>
}

export function getFilterTypeOperatorDetails(
  locale: Locale,
): FilterTypeOperatorDetails {
  return {
    text: getTextFilterDetails(locale),
    number: getNumberFilterDetails(locale),
    date: getDateFilterDetails(locale),
    option: getOptionFilterDetails(locale),
    multiOption: getMultiOptionFilterDetails(locale),
  }
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
  locale: Locale,
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

  const opDetails = getFilterTypeOperatorDetails(locale)[type][currentOperator]

  // Handle transition from single to multiple filter values.
  if (a < b && b >= 2) return opDetails.singularOf ?? currentOperator
  // Handle transition from multiple to single filter values.
  if (a > b && b <= 1) return opDetails.pluralOf ?? currentOperator
  return currentOperator
}
