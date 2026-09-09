import { formatOklch, mapToSrgb, parseColorSeed } from './color.js'
import type {
  ColorSeed,
  GeneratedScale,
  GenerateScaleOptions,
} from './types.js'

export function generateColorScale(
  seed: ColorSeed,
  options: GenerateScaleOptions = {},
): GeneratedScale {
  const steps = options.steps ?? 11
  if (!Number.isInteger(steps) || steps < 2)
    throw new RangeError('steps must be an integer of at least 2')
  const source = parseColorSeed(seed)
  return Array.from({ length: steps }, (_, index) => {
    const position = index / (steps - 1)
    const smooth = position * position * (3 - 2 * position)
    const lightness = 0.99 - 0.89 * smooth
    const distance =
      position <= 0.58 ? (position - 0.58) / 0.28 : (position - 0.58) / 0.2
    const chroma = source.c * Math.exp(-0.5 * distance * distance)
    const color = mapToSrgb({
      mode: 'oklch',
      l: lightness,
      c: Math.min(chroma, source.c),
      h: source.h,
      alpha: 1,
    })
    return { index, position, color, css: formatOklch(color) }
  })
}
