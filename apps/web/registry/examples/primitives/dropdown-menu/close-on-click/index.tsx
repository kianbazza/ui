'use client'

import { DropdownMenu } from '@bazza-ui/react/dropdown-menu'
import { toast } from 'sonner'

export default function DropdownMenuCloseOnClick() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white pl-3 pr-2 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-popup-open:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 dark:data-popup-open:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
        Actions
        <CaretDownIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner className="outline-hidden" sideOffset={8}>
          <DropdownMenu.Popup className="relative origin-[var(--transform-origin)] border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <DropdownMenu.Surface>
              <DropdownMenu.Input
                className="outline-hidden px-4 h-8 text-sm placeholder:text-neutral-500 border-b border-neutral-950 dark:border-white"
                placeholder="Search..."
              />
              <DropdownMenu.List className="py-1">
                <DropdownMenu.Empty className="text-sm text-neutral-500 px-4 h-8 flex items-center">
                  No matching actions.
                </DropdownMenu.Empty>
                <DropdownMenu.Item
                  className={itemClass}
                  onSelect={() => toast('Copied to clipboard')}
                >
                  Copy
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={itemClass}
                  onSelect={() => toast('Cut to clipboard')}
                >
                  Cut
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={itemClass}
                  onSelect={() => toast('Pasted from clipboard')}
                >
                  Paste
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const itemClass =
  'relative z-[1] flex cursor-default items-center py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] data-disabled:text-neutral-500 data-highlighted:text-white data-highlighted:before:bg-neutral-950 dark:data-disabled:text-neutral-400 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white'

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  )
}
