import type { Metadata } from 'next'
import './globals.css'
import OneDollarStatsScript from '@/app/stats'
import { env } from '@/lib/env'
import { berkeleyMono, inter } from '@/lib/fonts'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Viewport } from 'next'

const title = 'bazza/ui — Hand-crafted, modern React components'
const description =
  'A collection of beautiful, modern React components. Open source. Open code. Free to use.'

export const metadata: Metadata = {
  title: {
    default: `${title}`,
    template: '%s — bazza/ui',
  },
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
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
  openGraph: {
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          title,
        )}&description=${encodeURIComponent(description)}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: `/og?title=${encodeURIComponent(
          title,
        )}&description=${encodeURIComponent(description)}`,
      },
    ],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: `${env.NEXT_PUBLIC_APP_URL}/site.webmanifest`,
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
        className={`${inter.variable} ${berkeleyMono.variable} font-sans antialiased bg-site-background min-h-svh`}
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
