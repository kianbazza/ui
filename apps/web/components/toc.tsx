// @ts-nocheck
'use client'

import * as React from 'react'

import { useMounted } from '@/hooks/use-mounted'
import type { TableOfContents } from '@/lib/toc'
import { cn } from '@/lib/utils'
import { ListIcon } from 'lucide-react'
import { Separator } from './ui/separator'

interface TocProps {
  toc: TableOfContents
}

export function DashboardTableOfContents({ toc }: TocProps) {
  const itemIds = React.useMemo(
    () =>
      toc.items
        ? toc.items
            .flatMap((item) => [item.url, item?.items?.map((item) => item.url)])
            .flat()
            .filter(Boolean)
            .map((id) => id?.split('#')[1])
        : [],
    [toc],
  )
  const activeHeading = useActiveItem(itemIds)
  const mounted = useMounted()

  if (!toc?.items?.length) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ListIcon className="size-4" />
        <span className="text-sm font-medium">On This Page</span>
      </div>
      <div className="mt-3 border-t border-border border-dashed" />
      <Tree tree={toc} activeItem={activeHeading} />
    </div>
  )
}

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // biome-ignore lint/complexity/noForEach: <explanation>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0% 0% -80% 0%' },
    )

    // biome-ignore lint/complexity/noForEach: <explanation>
    itemIds?.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      // biome-ignore lint/complexity/noForEach: <explanation>
      itemIds?.forEach((id) => {
        const element = document.getElementById(id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [itemIds])

  return activeId
}

interface TreeProps {
  tree: TableOfContents
  level?: number
  activeItem?: string
}

function Tree({ tree, level = 1, activeItem }: TreeProps) {
  return tree?.items?.length && level < 3 ? (
    <ul className={cn('m-0 list-none text-sm', { 'pl-4': level !== 1 })}>
      {tree.items.map((item, index) => {
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <li key={index} className={cn('mt-0 pt-2')}>
            <a
              href={item.url}
              className={cn(
                'inline-block no-underline transition-colors hover:text-foreground',
                item.url === `#${activeItem}`
                  ? 'font-medium text-foreground'
                  : 'font-[410] text-muted-foreground',
              )}
            >
              {item.title}
            </a>
            {item.items?.length ? (
              <Tree tree={item} level={level + 1} activeItem={activeItem} />
            ) : null}
          </li>
        )
      })}
    </ul>
  ) : null
}
