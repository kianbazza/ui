import { converter, differenceEuclidean, toGamut, wcagContrast } from 'culori'
import type { ColorSeed, OklchColor } from './types.js'
import { ColorInputError } from './types.js'

const toOklch = converter('oklch')
const toRgb = converter('rgb')
const toLrgb = converter('lrgb')
const toOklab = converter('oklab')
const gamutMap = toGamut('rgb', 'oklch', null)
const hue = (value: number): number => ((value % 360) + 360) % 360
const make = (l: number, c: number, h: number): OklchColor => ({
  mode: 'oklch',
  l,
  c,
  h: c < 1e-7 ? 0 : hue(h),
  alpha: 1,
})
const invalid = (
  code: 'invalid-format' | 'invalid-channel' | 'non-opaque',
  path: string,
  input: string,
): never => {
  throw new ColorInputError(code, path, input)
}

export function parseColorSeed(seed: ColorSeed, path = 'seed'): OklchColor {
  const input = seed.trim()
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(input)
  if (hex) {
    const raw = hex[1]!
    const alpha =
      raw.length === 4 ? raw[3] : raw.length === 8 ? raw.slice(6) : undefined
    if (alpha && !/^f{1,2}$/i.test(alpha)) invalid('non-opaque', path, seed)
    const digits =
      raw.length < 5
        ? raw
            .slice(0, 3)
            .split('')
            .map((x) => x + x)
        : [raw.slice(0, 2), raw.slice(2, 4), raw.slice(4, 6)]
    const rgb = digits.map((x) => Number.parseInt(x, 16) / 255)
    const result = toOklch({ mode: 'rgb', r: rgb[0]!, g: rgb[1]!, b: rgb[2]! })!
    return make(result.l, result.c, result.h ?? 0)
  }
  const match =
    /^oklch\(\s*([^\s]+)\s+([^\s]+)\s+([^\s/]+)(?:\s*\/\s*([^\s]+))?\s*\)$/i.exec(
      input,
    )
  if (!match) invalid('invalid-format', path, seed)
  const [, lRaw, cRaw, hRaw, alphaRaw] = match!
  const numberToken = /^[+-]?(?:(?:\d+(?:\.\d+)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/
  const lToken = lRaw!.endsWith('%') ? lRaw!.slice(0, -1) : lRaw!
  const hToken = /deg$/i.test(hRaw!) ? hRaw!.slice(0, -3) : hRaw!
  if (
    !numberToken.test(lToken) ||
    !numberToken.test(cRaw!) ||
    !numberToken.test(hToken)
  )
    invalid('invalid-channel', path, seed)
  const l = lRaw!.endsWith('%')
    ? Number.parseFloat(lRaw!) / 100
    : Number.parseFloat(lRaw!)
  const c = Number.parseFloat(cRaw!)
  const h = /deg$/i.test(hRaw!)
    ? Number.parseFloat(hRaw!.slice(0, -3))
    : Number.parseFloat(hRaw!)
  if (alphaRaw) {
    const percentage = alphaRaw.endsWith('%')
    const alphaToken = percentage ? alphaRaw.slice(0, -1) : alphaRaw
    const alpha = numberToken.test(alphaToken)
      ? Number.parseFloat(alphaToken) / (percentage ? 100 : 1)
      : Number.NaN
    if (alpha !== 1) invalid('non-opaque', path, seed)
  }
  if (![l, c, h].every(Number.isFinite) || l < 0 || l > 1 || c < 0 || c > 0.5)
    invalid('invalid-channel', path, seed)
  return make(l, c, h)
}

export function formatOklch(color: OklchColor): string {
  const rounded = (value: number) => Number(value.toFixed(4)).toString()
  return `oklch(${rounded(color.l)} ${rounded(color.c)} ${rounded(color.h)}${color.alpha === 1 ? '' : ` / ${color.alpha}`})`
}
export function mapToSrgb(color: OklchColor): OklchColor {
  const mapped = gamutMap(color)
  let normalized = toOklch({
    mode: 'rgb',
    r: Math.min(1, Math.max(0, mapped.r!)),
    g: Math.min(1, Math.max(0, mapped.g!)),
    b: Math.min(1, Math.max(0, mapped.b!)),
  })!
  for (let i = 0; i < 4; i++) {
    const rgb = toRgb(normalized)!
    if ([rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1))
      break
    normalized = {
      ...normalized,
      c: normalized.c * (1 - 1e-8),
    }
  }
  return make(normalized.l, normalized.c, normalized.h ?? color.h)
}
export function getContrastRatio(
  foreground: OklchColor,
  background: OklchColor,
): number {
  return wcagContrast(
    toRgb(mapToSrgb(foreground))!,
    toRgb(mapToSrgb(background))!,
  )
}

export function compareAccessibleForegroundCandidates(
  candidate: OklchColor,
  a: OklchColor,
  b: OklchColor,
  aContrast: number,
  bContrast: number,
): number {
  return (
    Math.abs(a.l - candidate.l) - Math.abs(b.l - candidate.l) ||
    bContrast - aContrast ||
    a.l - b.l
  )
}

export function findAccessibleForeground(
  backgrounds: readonly OklchColor[],
  candidate: OklchColor,
  minimum: number,
): OklchColor {
  const mappedCandidate = mapToSrgb(candidate)
  if (
    backgrounds.every(
      (background) => getContrastRatio(mappedCandidate, background) >= minimum,
    )
  )
    return mappedCandidate
  const passing: OklchColor[] = []
  for (const direction of [0, 1]) {
    const endpoint = mapToSrgb(make(direction, candidate.c, candidate.h))
    if (
      !backgrounds.every(
        (background) => getContrastRatio(endpoint, background) >= minimum,
      )
    )
      continue
    let low = direction === 0 ? 0 : candidate.l
    let high = direction === 0 ? candidate.l : 1
    for (let i = 0; i < 28; i++) {
      const mid = (low + high) / 2
      const works = backgrounds.every(
        (background) =>
          getContrastRatio(
            mapToSrgb(make(mid, candidate.c, candidate.h)),
            background,
          ) >= minimum,
      )
      if (direction === 0 ? works : !works) low = mid
      else high = mid
    }
    const result = mapToSrgb(
      make(direction === 0 ? low : high, candidate.c, candidate.h),
    )
    if (
      backgrounds.every(
        (background) => getContrastRatio(result, background) >= minimum,
      )
    )
      passing.push(result)
  }
  if (!passing.length)
    throw new ColorInputError(
      'no-accessible-color',
      'candidate',
      formatOklch(candidate),
    )
  const contrast = (color: OklchColor) =>
    Math.min(
      ...backgrounds.map((background) => getContrastRatio(color, background)),
    )
  return passing.sort((a, b) =>
    compareAccessibleForegroundCandidates(
      candidate,
      a,
      b,
      contrast(a),
      contrast(b),
    ),
  )[0]!
}

export function compositeColors(
  foreground: OklchColor,
  background: OklchColor,
  alpha: number,
): OklchColor {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
    throw new RangeError('alpha must be a finite number between 0 and 1')
  const fgLinear = toLrgb(foreground)!
  const bgLinear = toLrgb(background)!
  const result = {
    mode: 'lrgb' as const,
    r: fgLinear.r! * alpha + bgLinear.r! * (1 - alpha),
    g: fgLinear.g! * alpha + bgLinear.g! * (1 - alpha),
    b: fgLinear.b! * alpha + bgLinear.b! * (1 - alpha),
  }
  const converted = toOklch(toRgb(result)!)!
  return mapToSrgb(make(converted.l, converted.c, converted.h ?? 0))
}
export function getColorDifference(a: OklchColor, b: OklchColor): number {
  return differenceEuclidean('oklab')(toOklab(a), toOklab(b))
}
