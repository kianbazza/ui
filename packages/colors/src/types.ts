export type ColorSeed = string
export type OklchColor = {
  mode: 'oklch'
  l: number
  c: number
  h: number
  alpha: 1
}
export type GeneratedScaleStop = {
  index: number
  position: number
  color: OklchColor
  css: string
}
export type GeneratedScale = readonly GeneratedScaleStop[]
export type GenerateScaleOptions = { steps?: number }
export type ColorInputErrorCode =
  | 'invalid-format'
  | 'invalid-channel'
  | 'non-opaque'
  | 'no-accessible-color'

export class ColorInputError extends Error {
  readonly code: ColorInputErrorCode
  readonly path: string
  readonly input: string
  constructor(
    code: ColorInputErrorCode,
    path: string,
    input: string,
    message = `${code} at ${path}`,
  ) {
    super(message)
    this.name = 'ColorInputError'
    this.code = code
    this.path = path
    this.input = input
  }
}
