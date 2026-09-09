import { converter } from 'culori'
import { describe, expect, it } from 'vitest'
import { compareAccessibleForegroundCandidates } from './color.js'
import {
  ColorInputError,
  compositeColors,
  findAccessibleForeground,
  formatOklch,
  getColorDifference,
  getContrastRatio,
  mapToSrgb,
  parseColorSeed,
} from './index.js'

const toRgb = converter('rgb')
const inSrgb = (color: Parameters<typeof toRgb>[0]) => {
  const rgb = toRgb(color)!
  return [rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1)
}

const white = parseColorSeed('#fff')
const black = parseColorSeed('#000')

describe('color foundations', () => {
  it('accepts strict opaque hex and OKLCH forms', () => {
    for (const seed of [
      '#abc',
      '#abcf',
      '#aabbcc',
      '#aabbccff',
      'oklch(50% 0.2 30)',
      'oklch(0% 0 0)',
      'oklch(100% 0.5 360)',
      'oklch(0.5 0.2 390deg)',
      'oklch(0.5 0.2 30 / 1)',
      'oklch(0.5 0.2 30 / 1.0)',
      'oklch(0.5 0.2 30 / 1e0)',
      'oklch(0.5 0.2 30 / 100%)',
      'oklch(0.5 0.2 30 / 100.0%)',
      'oklch(0.5 0.2 30deg)',
      'oklch(5e-1 2e-1 3e1deg)',
    ])
      expect(parseColorSeed(seed).alpha).toBe(1)
    expect(parseColorSeed('oklch(0.5 0 720)').h).toBe(0)
  })

  it('rejects unsupported syntax and channels with structured errors', () => {
    const cases: [string, string][] = [
      ['#aabbcc00', 'non-opaque'],
      ['#abc0', 'non-opaque'],
      ['oklch(50% 0.2 30 / .5)', 'non-opaque'],
      ['oklch(50% 0.2 30 / 1.e0)', 'non-opaque'],
      ['oklch(50% 0.2 30 / 100x)', 'non-opaque'],
      ['oklch(1.1 0.2 30)', 'invalid-channel'],
      ['oklch(101% 0.2 30)', 'invalid-channel'],
      ['oklch(-1% 0.2 30)', 'invalid-channel'],
      ['oklch(0.5 -0.1 30)', 'invalid-channel'],
      ['oklch(0.5 0.5001 30)', 'invalid-channel'],
      ['oklch(50% 0.2 30rad)', 'invalid-channel'],
      ['oklch(0.5px 0.2 30)', 'invalid-channel'],
      ['oklch(0.5 0.2px 30)', 'invalid-channel'],
      ['oklch(0.5 0.2 30px)', 'invalid-channel'],
      ['oklch(none 0.2 30)', 'invalid-channel'],
      ['oklch(50% 20% 30)', 'invalid-channel'],
      ['oklch(-0.1 0.2 30)', 'invalid-channel'],
      ['oklch(0.5 0.2 30e)', 'invalid-channel'],
      ['oklch(0.5 .2e- 30)', 'invalid-channel'],
      ['oklch(0.5 0.2 3e1px)', 'invalid-channel'],
      ['oklch(0.5 0.2 30.)', 'invalid-channel'],
      ['oklch(0.5 0.2 1.e2)', 'invalid-channel'],
      ['oklch(0.5 0.2 30) trailing', 'invalid-format'],
      ['oklch(0.5 0.2)', 'invalid-format'],
      ['rgb(1 2 3)', 'invalid-format'],
    ]
    for (const [seed, code] of cases)
      expect(() => parseColorSeed(seed, 'theme.brand')).toThrowError(
        expect.objectContaining({ code, path: 'theme.brand', input: seed }),
      )
  })

  it('formats stably and maps out-of-gamut colors', () => {
    expect(
      formatOklch({
        mode: 'oklch',
        l: 0.5,
        c: 0.123456,
        h: 30.123456,
        alpha: 1,
      }),
    ).toBe('oklch(0.5 0.1235 30.1235)')
    for (const color of [
      mapToSrgb(parseColorSeed('oklch(0.8 0.5 90)')),
      mapToSrgb(parseColorSeed('oklch(0.5 0.5 250)')),
    ]) {
      expect(color.c).toBeGreaterThanOrEqual(0)
      expect(inSrgb(color)).toBe(true)
    }
  })

  it('calculates WCAG contrast and searches accessible foregrounds', () => {
    expect(getContrastRatio(black, white)).toBeCloseTo(21, 10)
    expect(getContrastRatio(white, black)).toBeCloseTo(21, 10)
    const candidate = parseColorSeed('oklch(0.5 0.1 30)')
    const accessible45 = findAccessibleForeground([white], candidate, 4.5)
    expect(getContrastRatio(accessible45, white)).toBeGreaterThanOrEqual(4.5)
    expect(inSrgb(accessible45)).toBe(true)
    const accessible3 = findAccessibleForeground([white], candidate, 3)
    expect(getContrastRatio(accessible3, white)).toBeGreaterThanOrEqual(3)
    expect(inSrgb(accessible3)).toBe(true)
    const alreadyPassing = findAccessibleForeground(
      [white],
      parseColorSeed('oklch(0.4 0 0)'),
      3,
    )
    expect(alreadyPassing.l).toBeCloseTo(0.4, 5)
    const tieCandidate = parseColorSeed('oklch(0.4914925 0 0)')
    const tie = findAccessibleForeground(
      [parseColorSeed('oklch(0.5 0 0)')],
      tieCandidate,
      3,
    )
    expect(
      getContrastRatio(tie, parseColorSeed('oklch(0.5 0 0)')),
    ).toBeGreaterThanOrEqual(3)
    expect(tie.l).toBeLessThan(tieCandidate.l)

    const midpoint = parseColorSeed('oklch(0.5 0 0)')
    const darker = parseColorSeed('oklch(0.4 0 0)')
    const lighter = parseColorSeed('oklch(0.6 0 0)')
    expect(
      compareAccessibleForegroundCandidates(midpoint, darker, lighter, 4, 5),
    ).toBeGreaterThan(0)
    expect(
      compareAccessibleForegroundCandidates(midpoint, darker, lighter, 5, 5),
    ).toBeLessThan(0)
    expect(() =>
      findAccessibleForeground(
        [parseColorSeed('oklch(0.5 0 0)')],
        parseColorSeed('oklch(0.5 0 0)'),
        21,
      ),
    ).toThrowError(expect.objectContaining({ code: 'no-accessible-color' }))
  })

  it('composites in linear RGB and measures OKLab difference', () => {
    const result = compositeColors(white, black, 0.5)
    expect(result.l).toBeCloseTo(0.7937, 4)
    expect(inSrgb(result)).toBe(true)
    for (const alpha of [Number.NaN, -0.1, 1.1])
      expect(() => compositeColors(white, black, alpha)).toThrowError(
        RangeError,
      )
    expect(
      inSrgb(
        compositeColors(
          { mode: 'oklch', l: 0.7, c: 0.5, h: 60, alpha: 1 },
          black,
          0.5,
        ),
      ),
    ).toBe(true)
    expect(getColorDifference(black, black)).toBe(0)
    expect(getColorDifference(black, white)).toBeGreaterThan(0)
    expect(new ColorInputError('invalid-format', 'x', 'y')).toBeInstanceOf(
      Error,
    )
  })
})
