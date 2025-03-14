export function isAnyOf<T>(value: T, array: T[]) {
  return array.includes(value)
}
