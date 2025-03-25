import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Viewport } from 'next'
import { berkeleyMono, inter } from '@/lib/fonts'
import OneDollarStatsScript from '@/app/stats'

export const metadata: Metadata = {
  title: 'Data table filters | bazza/ui',
  description:
    'A powerful data table filter component inspired by Linear. Open source and free forever.',
}

export const viewport: Viewport = {
  themeColor: [
    { color: 'var(--site-background)', media: '(prefers-color-scheme: light)' },
    { color: 'var(--site-background)', media: '(prefers-color-scheme: dark)' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <OneDollarStatsScript />
      <body
        className={`${inter.variable} ${berkeleyMono.variable} font-sans antialiased bg-site-background h-screen w-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
