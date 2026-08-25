'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { LABEL_STYLES_BG, labelData, type TW_COLOR } from './data'

export default function DropdownMenuSearch() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Labels
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input placeholder="Search labels..." />
              <DropdownMenu.List>
                {labelData.map((label) => (
                  <DropdownMenu.Item
                    key={label.id}
                    value={label.name}
                    keywords={label.keywords}
                  >
                    <DropdownMenu.Icon>
                      <LabelDot color={label.color} />
                    </DropdownMenu.Icon>
                    {label.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function LabelDot({ color }: { color: string }) {
  return (
    <div
      className={cn(
        'rounded-full size-2.5',
        LABEL_STYLES_BG[color as TW_COLOR] ?? 'bg-neutral-500',
      )}
    />
  )
}
