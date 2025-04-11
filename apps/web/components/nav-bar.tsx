import { Button } from '@/components/ui/button'
import logoSrc from '@/public/bazzaui-v3-color.png'
import Image from 'next/image'
import Link from 'next/link'
import { GithubIcon, XIcon } from './icons'
import { ThemeToggle } from './theme-toggle'

export function NavBar() {
  return (
    <div className="flex items-center gap-4 justify-between h-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-medium font-mono tracking-tight text-sm"
      >
        <Image
          className="size-6 mr-1 translate-y-[-0.75px]"
          src={logoSrc}
          alt="bazza/ui"
        />
        <span>bazza</span>
        <span className="text-xl text-border">/</span>
        <span>ui</span>
      </Link>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild>
          <Link href="https://x.com/kianbazza">
            <XIcon className="size-3.5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="https://github.com/kianbazza/ui">
            <GithubIcon className="size-5" />
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}
