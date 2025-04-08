export function intersection<T>(a: T[], b: T[]): T[] {
  return a.filter((x) => b.includes(x))
}

export function uniq<T>(a: T[]): T[] {
  return Array.from(new Set(a))
}

export function take<T>(a: T[], n: number): T[] {
  return a.slice(0, n)
}

export function flatten<T>(a: T[][]): T[] {
  return a.flat()
}

export function addUniq<T>(arr: T[], values: T[]): T[] {
  return uniq([...arr, ...values])
}

export function removeUniq<T>(arr: T[], values: T[]): T[] {
  return arr.filter((v) => !values.includes(v))
}

export function isAnyOf<T>(value: T, values: T[]): boolean {
  return values.includes(value)
}
