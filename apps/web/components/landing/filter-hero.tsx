import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  CircleCheckIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  FilterIcon,
  XIcon,
} from 'lucide-react'

export function FilterHero() {
  return (
    <div className="text-xs flex h-full items-stretch gap-2 lg:scale-125 origin-top-left **:select-none **:pointer-events-none">
      <Button variant="outline" className="h-7 w-fit lg:inline-flex hidden">
        <FilterIcon className="size-4" />
      </Button>
      <div className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs">
        <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
          <CircleDotDashedIcon className="size-4 stroke-[2.25px]" />
          <span>Status</span>
        </span>
        <Separator orientation="vertical" />
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          is any of
        </Button>
        <Separator orientation="vertical" />
        <div className="relative">
          <Button
            variant="ghost"
            className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
          >
            <div className="inline-flex items-center gap-0.5">
              <CircleIcon className="size-4" />
              <CircleDotIcon className="size-4" />
              <CircleCheckIcon className="size-4" />
              <span className="ml-1.5">3 statuses</span>
            </div>
          </Button>
          <div className="absolute top-[140%] bg-popover text-popover-foreground rounded-md border shadow-md outline-hidden w-42 p-0">
            <Command loop>
              <CommandInput placeholder="Search..." />
              <CommandList className="max-h-fit">
                <CommandGroup>
                  <CommandItem className="group flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        checked={true}
                        className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                      />
                      <CircleDotDashedIcon className="size-4 text-primary" />
                      <span>
                        Backlog
                        <sup
                          className={cn(
                            'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                            'slashed-zero',
                          )}
                        >
                          23
                        </sup>
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem className="group flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        checked={true}
                        className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                      />
                      <CircleIcon className="size-4 text-primary" />
                      <span>
                        Todo
                        <sup
                          className={cn(
                            'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                            'slashed-zero',
                          )}
                        >
                          16
                        </sup>
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem className="group flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        checked={true}
                        className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                      />
                      <CircleDotIcon className="size-4 text-primary" />
                      <span>
                        In Progress
                        <sup
                          className={cn(
                            'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                            'slashed-zero',
                          )}
                        >
                          7
                        </sup>
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem className="group flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Checkbox className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100" />
                      <CircleCheckIcon className="size-4 text-primary" />
                      <span>
                        Done
                        <sup
                          className={cn(
                            'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
                            'slashed-zero',
                          )}
                        >
                          44
                        </sup>
                      </span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>

        <Popover open>
          <PopoverTrigger asChild></PopoverTrigger>
        </Popover>
        <Separator orientation="vertical" />
        <Button
          variant="ghost"
          className="rounded-none rounded-r-2xl text-xs w-7 h-full"
        >
          <XIcon className="size-4 -translate-x-0.5" />
        </Button>
      </div>
    </div>
  )
}
