'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { PanelLeftOpenIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export default function AppSidebarOpenTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <div className="hidden absolute top-4 md:top-4 left-2 md:flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="size-7" variant="ghost" onClick={toggleSidebar}>
            <PanelLeftOpenIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={4}
          className="bg-popover border border-border text-popover-foreground"
          showArrow={false}
        >
          Open sidebar
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
