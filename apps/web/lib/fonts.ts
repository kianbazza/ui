import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  style: ['normal', 'italic'],
  axes: ['opsz'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const berkeleyMono = localFont({
  src: '../assets/fonts/berkeley-mono/BerkeleyMono-Variable.woff2',
  variable: '--font-berkeley-mono',
  display: 'swap',
})

export { inter, geistMono, berkeleyMono }
