import type { Metadata } from 'next'
import './globals.css'
import OneDollarStatsScript from '@/app/stats'
import ThemeColorUpdater from '@/components/theme-color-updater'
import { META_THEME_COLORS } from '@/lib/config'
import { env } from '@/lib/env'
import { berkeleyMono, inter } from '@/lib/fonts'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Viewport } from 'next'
import Head from 'next/head'
import Script from 'next/script'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

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
  themeColor: META_THEME_COLORS.light,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <Script src="https://cdn.jsdelivr.net/npm/react-scan/dist/auto.global.js" /> */}
      <OneDollarStatsScript />
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${berkeleyMono.variable} font-sans antialiased bg-site-background min-h-svh`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <NuqsAdapter>
            <div data-vaul-drawer-wrapper="true">
              <div className="relative flex min-h-svh flex-col bg-site-background">
                <ThemeColorUpdater />
                {children}
              </div>
            </div>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
