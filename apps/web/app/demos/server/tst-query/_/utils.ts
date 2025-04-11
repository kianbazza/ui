import { add, differenceInDays } from 'date-fns'
import { randomInteger } from 'remeda'

export const calculateEndDate = (start: Date) => {
  const diff = differenceInDays(new Date(), start)
  const offset = randomInteger(0, diff + 1)

  return add(start, { days: offset })
}

export function isAnyOf<T>(value: T, array: T[]) {
  return array.includes(value)
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
