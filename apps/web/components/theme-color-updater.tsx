'use client'

import { META_THEME_COLORS } from '@/lib/config'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // Mark component as mounted
  }, [])

  useEffect(() => {
    if (!mounted) return // Skip until mounted to avoid SSR issues

    // Get or create the theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }

    // Update the theme-color based on resolvedTheme
    const color =
      resolvedTheme === 'dark'
        ? META_THEME_COLORS.dark
        : META_THEME_COLORS.light
    metaThemeColor.setAttribute('content', color)
  }, [resolvedTheme, mounted])

  return null // This component renders nothing
}
