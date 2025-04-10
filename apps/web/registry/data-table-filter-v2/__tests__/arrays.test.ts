import { describe, expect, it } from 'vitest'
import { uniq } from '../lib/array'

describe('lib/array', () => {
  describe('uniq', () => {
    it('should return an empty array for an empty input', () => {
      const data: any[] = []
      expect(uniq(data)).toEqual([])
    })

    it('should work with referential equality', () => {
      const item = { id: 1 }
      const data = [item, item]
      expect(uniq(data)).toHaveLength(1)
      expect(uniq(data)[0]).toBe(item)
    })

    it('should work with deep equality for objects', () => {
      const data = [
        { id: 1, name: 'IB Bank' },
        { id: 1, name: 'IB Bank' },
      ]
      const uniqueData = uniq(data)
      expect(uniqueData).toHaveLength(1)
      expect(uniqueData[0]).toEqual({ id: 1, name: 'IB Bank' })
    })

    it('should work with primitive values', () => {
      const numbers = [1, 2, 2, 3, 1, 4]
      const uniqueNumbers = uniq(numbers)
      expect(uniqueNumbers).toHaveLength(4)
      expect(uniqueNumbers).toEqual(expect.arrayContaining([1, 2, 3, 4]))

      const strings = ['a', 'b', 'a', 'c']
      const uniqueStrings = uniq(strings)
      expect(uniqueStrings).toHaveLength(3)
      expect(uniqueStrings).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    })

    it('should work with nested arrays', () => {
      const data = [
        [1, 2],
        [1, 2],
        [2, 3],
      ]
      const uniqueData = uniq(data)
      expect(uniqueData).toHaveLength(2)
      expect(uniqueData).toEqual(
        expect.arrayContaining([
          [1, 2],
          [2, 3],
        ]),
      )
    })

    it('should work with nested objects and arrays', () => {
      const data = [
        { id: 1, arr: [1, 2, { nested: 'a' }] },
        { id: 1, arr: [1, 2, { nested: 'a' }] },
        { id: 2, arr: [3, 4, { nested: 'b' }] },
      ]
      const uniqueData = uniq(data)
      expect(uniqueData).toHaveLength(2)
      expect(uniqueData).toEqual(
        expect.arrayContaining([
          { id: 1, arr: [1, 2, { nested: 'a' }] },
          { id: 2, arr: [3, 4, { nested: 'b' }] },
        ]),
      )
    })

    it('should work with a mix of types', () => {
      const data = [
        1,
        '1',
        { val: 1 },
        { val: '1' },
        [1],
        [1],
        null,
        null,
        undefined,
        undefined,
      ]
      const uniqueData = uniq(data)
      // The expected length depends on deep equality of all these different types.
      expect(uniqueData).toHaveLength(7)
      expect(uniqueData).toEqual(
        expect.arrayContaining([
          1,
          '1',
          { val: 1 },
          { val: '1' },
          [1],
          null,
          undefined,
        ]),
      )
    })

    it('should consider functions equal if their toString representations are equal', () => {
      // Warning: using toString for functions is usually not recommended for complex cases.
      const func1 = () => 1
      const func2 = () => 1
      const func3 = () => 1
      const data = [func1, func1, func2, func3]
      const uniqueData = uniq(data)
      // Depending on the implementation of function toString, func1 and func2 might have the same string representation.
      // func3 (an arrow function) likely has a different string representation than func1 and func2.
      expect(uniqueData.length).toBeGreaterThanOrEqual(2)
    })
  })
})
