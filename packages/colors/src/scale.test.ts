import { converter } from 'culori'
import { describe, expect, it } from 'vitest'
import { generateColorScale } from './index.js'

const toRgb = converter('rgb')

describe('color scales', () => {
  it('generates a monotone, in-gamut scale with a central chroma peak', () => {
    const scale = generateColorScale('oklch(0.6 0.2 220)')
    expect(scale).toHaveLength(11)
    expect(scale[0]!.color.l).toBeCloseTo(0.99, 4)
    expect(scale.at(-1)!.color.l).toBeCloseTo(0.1, 4)
    for (let i = 1; i < scale.length; i++)
      expect(scale[i]!.color.l).toBeLessThan(scale[i - 1]!.color.l)
    const detailedScale = generateColorScale('oklch(0.6 0.03 220)', {
      steps: 101,
    })
    const peak = detailedScale.reduce(
      (best, stop) => (stop.color.c > best.color.c ? stop : best),
      detailedScale[0]!,
    )
    expect(peak.position).toBe(0.58)
    expect(peak.color.c).toBeCloseTo(0.03, 10)
    for (const stop of scale) {
      expect(stop.color.alpha).toBe(1)
      const rgb = toRgb(stop.color)!
      expect(
        [rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1),
      ).toBe(true)
    }
  })

  it('rejects too few or fractional steps', () => {
    expect(() => generateColorScale('#fff', { steps: 1 })).toThrow()
    expect(() => generateColorScale('#fff', { steps: 2.5 })).toThrow()
  })
})
