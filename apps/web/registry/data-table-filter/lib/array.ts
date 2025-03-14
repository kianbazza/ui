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
