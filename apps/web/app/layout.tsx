import type { Metadata } from 'next'
import './globals.css'
import OneDollarStatsScript from '@/app/stats'
import { berkeleyMono, inter } from '@/lib/fonts'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'bazza/ui — Hand-crafted, modern React components',
    template: '%s — bazza/ui',
  },
  metadataBase: new URL('https://ui.bazza.dev'),
  description:
    'A collection of beautiful, modern React components. Open source. Open code. Free to use.',
  keywords: [
    'React',
    'shadcn/ui',
    'Next.js',
    'Tailwind CSS',
    'TypeScript',
    'Radix UI',
  ],
  authors: [
    {
      name: 'Kian Bazza',
      url: 'https://bazza.dev',
    },
  ],
  creator: 'Kian Bazza',
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
