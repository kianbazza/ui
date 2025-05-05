import { Button } from '@/components/ui/button'
import logoSrc from '@/public/bazzaui-v3-color.png'
import Image from 'next/image'
import Link from 'next/link'
import { DiscordIcon, GithubIcon, XIcon } from './icons'
import { NavBarItem } from './nav-bar-item'
import { ThemeToggle } from './theme-toggle'

const navItems = [
  { href: '/docs/intro', label: 'Docs' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/demos/server/tst-query', label: 'Examples' },
]

export function NavBar() {
  return (
    <div className="grid grid-cols-3 items-center gap-4 h-8">
      <div className="flex items-center gap-16">
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
      </div>
      <ul className="flex justify-center text-sm items-center gap-4 ">
        {navItems.map(({ href, label }) => (
          <li key={href}>
            <NavBarItem
              href={href}
              label={label}
              className="group text-muted-foreground data-[active=true]:text-primary group-hover:text-primary transition-colors"
            />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" asChild>
          <Link href="https://x.com/kianbazza">
            <XIcon className="size-3.5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="https://ui.bazza.dev/chat">
            <DiscordIcon className="size-5" />
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
