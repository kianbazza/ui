import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Viewport } from 'next'

const inter = Inter({
  axes: ['opsz'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-neutral-50/25 dark:bg-neutral-950 h-screen w-screen`}
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
