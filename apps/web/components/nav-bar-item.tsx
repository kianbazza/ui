'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavBarItemProps = {
  href: string
  label: string
} & React.HTMLAttributes<HTMLAnchorElement>

export function NavBarItem({ href, label, ...props }: NavBarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href)

  console.log('href:', href)
  console.log('pathname:', pathname)

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link
        data-active={isActive ? 'true' : undefined}
        className={cn(props.className)}
        href={href}
        {...props}
      >
        {label}
      </Link>
    </Button>
  )
}
