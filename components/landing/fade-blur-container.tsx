'use client'

import { cn } from '@/lib/utils'
import { type ReactNode, useMemo } from 'react'

type BasicDirection = 'top' | 'bottom' | 'left' | 'right'
type CornerDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
type FadeDirection = BasicDirection | CornerDirection | Array<BasicDirection>

type FadeStyle = 'linear' | 'radial'

interface FadeBlurContainerProps {
  children: ReactNode
  fadeColor?: string
  blurIntensity?: number
  fadeDirection?: FadeDirection
  fadeStyle?: FadeStyle
  fadeStart?: number
  fadeEnd?: number
  className?: string
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  let hexValue = hex
  // Remove # if present
  hexValue = hex.replace('#', '')

  // Convert 3-digit hex to 6-digit
  if (hexValue.length === 3) {
    hexValue =
      hexValue[0] +
      hexValue[0] +
      hexValue[1] +
      hexValue[1] +
      hexValue[2] +
      hexValue[2]
  }

  // Parse the hex values
  const r = Number.parseInt(hexValue.substring(0, 2), 16)
  const g = Number.parseInt(hexValue.substring(2, 4), 16)
  const b = Number.parseInt(hexValue.substring(4, 6), 16)

  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function FadeBlurContainer({
  children,
  fadeColor = '#000000',
  blurIntensity = 10,
  fadeDirection = 'bottom',
  fadeStyle = 'linear',
  fadeStart = 30,
  fadeEnd = 100,
  className,
}: FadeBlurContainerProps) {
  // Normalize fadeDirection to always be an array for consistent processing
  const normalizedDirections = useMemo(() => {
    if (Array.isArray(fadeDirection)) {
      return fadeDirection
    }

    // If it's a corner direction, we can't include it in multi-direction fades
    if (fadeDirection.includes('-')) {
      return [fadeDirection as CornerDirection]
    }

    return [fadeDirection as BasicDirection]
  }, [fadeDirection])

  // Memoize color calculations to avoid recalculating on every render
  const colorValues = useMemo(() => {
    const transparent = hexToRgba(fadeColor, 0)
    const semiTransparent = hexToRgba(fadeColor, 0.7)
    const opaque = fadeColor

    return { transparent, semiTransparent, opaque }
  }, [fadeColor])

  // Generate a single gradient for a specific direction
  const generateSingleGradient = (
    direction: BasicDirection | CornerDirection,
    isColorGradient: boolean,
  ) => {
    const { transparent, semiTransparent, opaque } = colorValues

    // For standard directions with linear gradients
    if (fadeStyle === 'linear') {
      // Handle standard directions
      if (['top', 'bottom', 'left', 'right'].includes(direction)) {
        const gradientDirection =
          direction === 'top'
            ? 'to top'
            : direction === 'left'
              ? 'to left'
              : direction === 'right'
                ? 'to right'
                : 'to bottom'

        if (isColorGradient) {
          return `linear-gradient(${gradientDirection}, 
            ${transparent} ${fadeStart}%, 
            ${semiTransparent} ${(fadeStart + fadeEnd) / 2}%, 
            ${opaque} ${fadeEnd}%)`
        }
        return `linear-gradient(${gradientDirection}, 
            transparent ${fadeStart}%, 
            black ${fadeEnd}%)`
      }

      // Handle corner directions with diagonal linear gradients
      let gradientDirection: string
      switch (direction) {
        case 'top-left':
          gradientDirection = 'to top left'
          break
        case 'top-right':
          gradientDirection = 'to top right'
          break
        case 'bottom-left':
          gradientDirection = 'to bottom left'
          break
        case 'bottom-right':
          gradientDirection = 'to bottom right'
          break
        default:
          gradientDirection = 'to bottom'
      }

      if (isColorGradient) {
        return `linear-gradient(${gradientDirection}, 
          ${transparent} ${fadeStart}%, 
          ${semiTransparent} ${(fadeStart + fadeEnd) / 2}%, 
          ${opaque} ${fadeEnd}%)`
      }
      return `linear-gradient(${gradientDirection}, 
          transparent ${fadeStart}%, 
          black ${fadeEnd}%)`
    }

    // For radial gradients (better for corner fades)

    let position: string
    switch (direction) {
      case 'top':
        position = '50% 0%'
        break
      case 'bottom':
        position = '50% 100%'
        break
      case 'left':
        position = '0% 50%'
        break
      case 'right':
        position = '100% 50%'
        break
      case 'top-left':
        position = '0% 0%'
        break
      case 'top-right':
        position = '100% 0%'
        break
      case 'bottom-left':
        position = '0% 100%'
        break
      case 'bottom-right':
        position = '100% 100%'
        break
      default:
        position = '50% 100%'
    }

    // For corners, use a larger radius to ensure full coverage
    const shape = ['top', 'bottom', 'left', 'right'].includes(direction)
      ? 'ellipse'
      : 'circle'

    // Invert the position for the gradient (we want to fade FROM the opposite corner)
    const invertedPosition = position
      .split(' ')
      .map((pos) => (pos === '0%' ? '100%' : pos === '100%' ? '0%' : pos))
      .join(' ')

    if (isColorGradient) {
      return `radial-gradient(${shape} at ${invertedPosition}, 
          ${transparent} ${fadeStart}%, 
          ${semiTransparent} ${(fadeStart + fadeEnd) / 2}%, 
          ${opaque} ${fadeEnd}%)`
    }
    return `radial-gradient(${shape} at ${invertedPosition}, 
          transparent ${fadeStart}%, 
          black ${fadeEnd}%)`
  }

  // Generate a single blur background for a specific direction
  const generateSingleBlurBackground = (
    direction: BasicDirection | CornerDirection,
  ) => {
    const { transparent } = colorValues

    if (fadeStyle === 'linear') {
      const gradientDirection =
        direction === 'top'
          ? 'to top'
          : direction === 'left'
            ? 'to left'
            : direction === 'right'
              ? 'to right'
              : direction === 'top-left'
                ? 'to top left'
                : direction === 'top-right'
                  ? 'to top right'
                  : direction === 'bottom-left'
                    ? 'to bottom left'
                    : direction === 'bottom-right'
                      ? 'to bottom right'
                      : 'to bottom'

      return `linear-gradient(${gradientDirection}, 
        ${transparent} ${fadeStart}%, 
        ${hexToRgba(fadeColor, 0.3)} ${(fadeStart + fadeEnd) / 2}%, 
        ${hexToRgba(fadeColor, 0.5)} ${fadeEnd}%)`
    }
    const position =
      direction === 'top'
        ? '50% 100%'
        : direction === 'bottom'
          ? '50% 0%'
          : direction === 'left'
            ? '100% 50%'
            : direction === 'right'
              ? '0% 50%'
              : direction === 'top-left'
                ? '100% 100%'
                : direction === 'top-right'
                  ? '0% 100%'
                  : direction === 'bottom-left'
                    ? '100% 0%'
                    : '0% 0%'

    const shape = ['top', 'bottom', 'left', 'right'].includes(direction)
      ? 'ellipse'
      : 'circle'

    return `radial-gradient(${shape} at ${position}, 
        ${transparent} ${fadeStart}%, 
        ${hexToRgba(fadeColor, 0.3)} ${(fadeStart + fadeEnd) / 2}%, 
        ${hexToRgba(fadeColor, 0.5)} ${fadeEnd}%)`
  }

  // Generate combined gradients for all specified directions
  const generateCombinedGradients = () => {
    // If there's only one direction or it's a corner, use the simple approach
    if (normalizedDirections.length === 1) {
      const direction = normalizedDirections[0]
      return {
        colorGradient: generateSingleGradient(direction, true),
        blurGradient: generateSingleGradient(direction, false),
        blurBackground: generateSingleBlurBackground(direction),
      }
    }

    // For multiple directions, combine the gradients
    const colorGradients = normalizedDirections
      .map((dir) => generateSingleGradient(dir, true))
      .join(', ')

    const blurGradients = normalizedDirections
      .map((dir) => generateSingleGradient(dir, false))
      .join(', ')

    const blurBackgrounds = normalizedDirections
      .map((dir) => generateSingleBlurBackground(dir))
      .join(', ')

    return {
      colorGradient: colorGradients,
      blurGradient: blurGradients,
      blurBackground: blurBackgrounds,
    }
  }

  const { colorGradient, blurGradient, blurBackground } =
    generateCombinedGradients()

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Actual content */}
      <div className="relative z-0">{children}</div>

      {/* Color fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: colorGradient,
        }}
      />

      {/* Blur overlay with mask */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backdropFilter: `blur(${blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          background: blurBackground,
          maskImage: blurGradient,
          WebkitMaskImage: blurGradient,
        }}
      />
    </div>
  )
}
