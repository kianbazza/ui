'use client'

import type {
  BreadcrumbNode,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

// Label color mapping
const LABEL_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

// Label dot component
function LabelDot({ color }: { color: string }) {
  return (
    <div
      className={cn(
        'rounded-full size-2.5',
        LABEL_COLORS[color] || 'bg-neutral-500',
      )}
    />
  )
}

// Label with breadcrumbs for deep search results
function LabelWithBreadcrumbs({
  label,
  breadcrumbs,
}: {
  label: string
  breadcrumbs?: BreadcrumbNode[]
}) {
  return (
    <span className="flex items-center gap-1 truncate min-w-0">
      {breadcrumbs?.map((crumb) => (
        <React.Fragment key={crumb.id ?? crumb.value}>
          <span className="text-muted-foreground truncate">{crumb.value}</span>
          <ChevronRightIcon className="size-3 text-muted-foreground/75 shrink-0" />
        </React.Fragment>
      ))}
      <span className="truncate">{label}</span>
    </span>
  )
}

// Caret icon for submenu triggers
function CaretRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Sample data
const labels = [
  { id: 'bug', name: 'Bug', color: 'red' },
  { id: 'enhancement', name: 'Enhancement', color: 'green' },
  { id: 'feature', name: 'Feature', color: 'blue' },
  { id: 'docs', name: 'Documentation', color: 'purple' },
  { id: 'urgent', name: 'Urgent', color: 'orange' },
  { id: 'low-priority', name: 'Low Priority', color: 'yellow' },
]

const statuses = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'Todo' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'done', name: 'Done' },
]

const priorities = [
  { id: 'no-priority', name: 'No priority' },
  { id: 'urgent', name: 'Urgent' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
]

// Helper to create an item node
function createItemNode(
  id: string,
  label: string,
  icon?: React.ReactNode,
  keywords?: string[],
): ItemDef {
  return {
    kind: 'item',
    id,
    value: label,
    keywords,
    render: ({ props, context }: ItemRenderParams) => {
      console.log('rendering item', {
        id: props.id,
      })
      return (
        <DropdownMenu.Item
          {...props}
          onSelect={() => toast(`Selected: ${label}`)}
          className={cn(
            'group/row flex items-center gap-2 text-sm select-none w-full',
            'py-1.5 px-3 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:inset-x-1 before:inset-y-0 before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          {icon && (
            <span className="min-h-4 min-w-4 flex items-center justify-center shrink-0">
              {icon}
            </span>
          )}
          <LabelWithBreadcrumbs
            label={label}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </DropdownMenu.Item>
      )
    },
  }
}

// Helper to create a submenu node
function createSubmenuNode(
  id: string,
  title: string,
  inputPlaceholder: string,
  childNodes: NodeDef[],
): SubmenuDef {
  return {
    kind: 'submenu',
    id,
    value: title,
    deepSearch: true,
    nodes: childNodes,
    render: ({ props, context, nodes, renderNode }: SubmenuRenderParams) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger
          {...props}
          className={cn(
            'group/row flex items-center justify-between gap-4 cursor-default text-sm select-none w-full',
            'py-1.5 px-3 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:inset-x-1 before:inset-y-0 before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          <LabelWithBreadcrumbs
            label={title}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
          <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={-2} align="list-start">
            <DropdownMenu.Popup className="w-[200px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              <DropdownMenu.Surface>
                <div className="border-b border-border">
                  <DropdownMenu.Input
                    placeholder={inputPlaceholder}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-9 px-3"
                  />
                </div>
                <DropdownMenu.List className="max-h-[200px] overflow-y-auto py-1">
                  {nodes.map((node) => renderNode(node))}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

export default function DropdownMenuDeepSearch() {
  // Build the menu structure
  const content: NodeDef[] = React.useMemo(() => {
    const statusItems = statuses.map((s) =>
      createItemNode(`status-${s.id}`, s.name, undefined, [s.name]),
    )

    const priorityItems = priorities.map((p) =>
      createItemNode(`priority-${p.id}`, p.name, undefined, [p.name]),
    )

    const labelItems: ItemDef[] = labels.map((label) => ({
      kind: 'item',
      id: `label-${label.id}`,
      value: label.name,
      keywords: [label.name, 'label', 'tag'],
      render: ({ props, context }: ItemRenderParams) => (
        <DropdownMenu.Item
          {...props}
          onSelect={() => toast(`Added label: ${label.name}`)}
          className={cn(
            'group/row flex items-center gap-2 text-sm select-none w-full',
            'py-1.5 px-3 relative z-[1]',
            'data-[highlighted]:text-accent-foreground',
            'before:absolute before:inset-x-1 before:inset-y-0 before:rounded-md before:z-[-1]',
            'data-[highlighted]:before:bg-accent',
          )}
        >
          <LabelDot color={label.color} />
          <LabelWithBreadcrumbs
            label={label.name}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </DropdownMenu.Item>
      ),
    }))

    return [
      createSubmenuNode('status', 'Status', 'Search status...', statusItems),
      createSubmenuNode(
        'priority',
        'Priority',
        'Search priority...',
        priorityItems,
      ),
      createSubmenuNode('labels', 'Labels', 'Search labels...', labelItems),
    ]
  }, [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
        Filter
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner sideOffset={8}>
          <DropdownMenu.Popup className="w-[240px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            <DropdownMenu.Surface
              content={content}
              deepSearch={{ enabled: true, minLength: 2 }}
            >
              <div className="border-b border-border">
                <DropdownMenu.Input
                  placeholder="Search all..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-9 px-3"
                />
              </div>

              <DropdownMenu.List className="max-h-[280px] overflow-y-auto py-1">
                <DeepSearchListContent />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DeepSearchListContent() {
  const { nodes, renderNode, isDeepSearching, count, search } =
    DropdownMenu.useDataList()

  return (
    <>
      {isDeepSearching && count > 0 && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/30 -mt-1 mb-1">
          Searching all menus...
        </div>
      )}

      {count === 0 && search.length >= 2 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          No matching options
        </div>
      ) : (
        nodes.map((node) => renderNode(node))
      )}
    </>
  )
}
