import { Geist_Mono, Inter } from 'next/font/google'
import localFont from 'next/font/local'

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

const berkeleyMono = localFont({
  src: '../assets/fonts/berkeley-mono/BerkeleyMono-Variable.woff2',
  variable: '--font-berkeley-mono',
  display: 'swap',
})

export { inter, geistMono, berkeleyMono }
