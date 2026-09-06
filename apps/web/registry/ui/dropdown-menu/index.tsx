'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import {
  type BreadcrumbNode,
  type DisplayNode,
  type DropdownMenuVirtualItem,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  isDisplaySeparatorNode,
  DropdownMenu as Primitive,
  type RadioGroupDef,
  useMaybeAsyncMenuCoordinator,
  useMaybeSubmenuContext,
  useSurfaceContext,
} from '@bazza-ui/react/dropdown-menu'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cva } from 'class-variance-authority'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import * as React from 'react'
import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { mergeRefs } from '@/lib/merge-refs'
import { cn } from '@/lib/utils'

const scrollAreaViewportVariants = cva('scroll-py-1 overscroll-none', {
  variants: {
    withScrollFade: {
      true: [
        // Gradient fade effect using CSS custom properties from Base UI ScrollArea
        'before:[--scroll-area-overflow-y-start:inherit] after:[--scroll-area-overflow-y-end:inherit]',
        'before:block after:block',
        'before:absolute after:absolute before:left-0 after:left-0 before:top-0 after:bottom-0',
        'before:w-full after:w-full before:z-10 after:z-10',
        'before:overscroll-contain after:overscroll-contain',
        'before:pointer-events-none after:pointer-events-none',
        'before:bg-gradient-to-b before:from-popover before:to-transparent',
        'after:bg-gradient-to-t after:from-popover after:to-transparent',
        'before:h-[min(24px,var(--scroll-area-overflow-y-start,0px))] after:h-[min(24px,var(--scroll-area-overflow-y-end,24px))]',
      ],
      false: '',
    },
  },
  defaultVariants: {
    withScrollFade: true,
  },
})

const scrollAreaScrollbarVariants = cva([
  'z-10',
  'flex w-1 touch-none select-none mx-0.5 my-2 bg-border/50 rounded-full',
  'data-[hovering]:opacity-100 hover:w-1.5 data-[scrolling]:opacity-100 opacity-0',
  'transition-[width,opacity] duration-150 ease-out',
])

const scrollAreaThumbVariants = cva(
  'relative flex-1 rounded-full bg-muted-foreground/50',
)

const menuItemVariants = cva(
  [
    // Base styles shared by all menu items
    'group group/row flex items-center text-sm select-none',
    'data-[highlighted]:text-accent-foreground',
    'h-8 px-4',
    'data-measuring:w-fit not-data-measuring:w-full',
    // Clip overflow at row level
    'overflow-hidden',
    'relative z-[1]',
    // Highlight background pseudo-element
    'before:absolute before:top-0 before:left-1 before:right-1 before:h-full before:rounded-md before:z-[-1]',
    'data-[highlighted]:before:bg-accent',
  ],
  {
    variants: {
      variant: {
        item: 'gap-2 aria-disabled:opacity-50',
        checkbox: 'gap-2 aria-disabled:opacity-50',
        radio: 'justify-between gap-2 aria-disabled:opacity-50',
        submenuTrigger: [
          'justify-between gap-4 cursor-default',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          'overflow-x-hidden',
        ],
        subpageTrigger: [
          'justify-between gap-4 cursor-default',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          'overflow-x-hidden',
          'data-[popup-open]:before:bg-accent',
          'data-[popup-open]:text-accent-foreground',
        ],
        subpageBackItem: 'gap-2 aria-disabled:opacity-50',
      },
    },
    defaultVariants: {
      variant: 'item',
    },
  },
)

const inputVariants = cva([
  'w-full bg-transparent text-sm outline-none',
  'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out group-data-navigating/dropdown-menu-popup:placeholder:transition-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'min-h-9.5 max-h-9.5 px-4',
  'caret-blue-500',
])

const listVariants = cva([
  'py-1 outline-none',
  '!min-w-full w-[min(500px,max(var(--row-width,200px),200px))]',
  '[&_:where([bazzaui-dropdown-menu-group-label])]:mt-3',
  // A label that opens the list shouldn't get the full group spacing above it.
  '[&_[bazzaui-dropdown-menu-group-label][data-first]]:mt-1',
  '[&_:where([bazzaui-dropdown-menu-group-label])]:mb-1',
  '[&_:where([bazzaui-dropdown-menu-group-label])]:px-4',
  '[&_:where([bazzaui-dropdown-menu-group-label])]:text-xs',
  '[&_:where([bazzaui-dropdown-menu-group-label])]:font-medium',
  '[&_:where([bazzaui-dropdown-menu-group-label])]:text-muted-foreground',
])

const surfaceVariants = cva('divide-y')

const headerVariants = cva(['flex items-center gap-2', 'px-2 py-2'])

const footerVariants = cva(['flex items-center justify-end gap-2', 'px-2 py-2'])

const subpageBackVariants = cva([
  'inline-flex items-center gap-1.5',
  'rounded-md px-2 py-1 text-xs font-medium',
  'text-muted-foreground transition-colors duration-100 ease-out',
  'hover:bg-accent hover:text-accent-foreground',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:pointer-events-none disabled:opacity-50',
])

function Root({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Primitive.Root>) {
  const handleOpenChange = useCallback(
    (
      open: boolean,
      eventDetails: Parameters<
        NonNullable<React.ComponentProps<typeof Primitive.Root>['onOpenChange']>
      >[1],
    ) => {
      // Prevent closing when clicking on feedback toolbar elements
      if (
        !open &&
        (eventDetails.reason === 'outside-press' ||
          eventDetails.reason === 'focus-out') &&
        eventDetails.event
      ) {
        const target = eventDetails.event.target as Element | null
        const feedbackToolbar = target?.closest(
          '[data-feedback-toolbar="true"]',
        )
        if (feedbackToolbar) {
          eventDetails.cancel()
          return
        }
      }
      onOpenChange?.(open, eventDetails)
    },
    [onOpenChange],
  )

  return <Primitive.Root onOpenChange={handleOpenChange} {...props} />
}

const Trigger = Primitive.Trigger

const Portal = Primitive.Portal

const Positioner = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Positioner>
>((props, ref) => {
  const submenuContext = useMaybeSubmenuContext()
  const isSubmenu = !!submenuContext

  const {
    className,
    align = isSubmenu ? 'list-start' : 'start',
    sideOffset = isSubmenu ? -2 : 8,
    ...rest
  } = props

  return (
    <Primitive.Positioner
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn('z-50', className)}
      {...rest}
    />
  )
})
Positioner.displayName = 'DropdownMenu.Positioner'

const Popup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Popup>
>(({ className, ...props }, ref) => (
  <Primitive.Popup
    ref={ref}
    className={(state) =>
      cn(
        'border bg-popover z-50 rounded-lg text-sm',
        'drop-shadow-xl',
        'overflow-hidden',
        'group/dropdown-menu-popup',
        !state.isSubmenu && [
          'opacity-100 scale-100',
          'origin-(--transform-origin)',
          'transition-[opacity,scale] duration-150 ease-out',
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
          'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
        ],
        className,
      )
    }
    {...props}
  />
))
Popup.displayName = 'DropdownMenu.Popup'

const Surface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Surface>
>(({ className, clearSearchOnClose = 'after-exit', ...props }, ref) => (
  <Primitive.Surface
    ref={ref}
    className={cn(surfaceVariants(), className)}
    clearSearchOnClose={clearSearchOnClose}
    {...props}
  />
))
Surface.displayName = 'DropdownMenu.Surface'

export interface ListProps
  extends Omit<
    React.ComponentProps<typeof Primitive.List>,
    'render' | 'children'
  > {
  viewportRef?: React.Ref<HTMLDivElement>
  /** Maximum height of the scrollable area. */
  maxHeight?: string | number
  /** Whether to show gradient fade at scroll edges. */
  withScrollFade?: boolean
  /**
   * Enable virtualization for large lists.
   * When true, only visible items are rendered for better performance.
   */
  virtualized?: boolean
  /**
   * Estimated size of each item in pixels. Used by virtualizer.
   * Only applies when `virtualized` is true.
   * @default 36
   */
  estimateSize?: number
  /**
   * Number of items to render outside the visible area.
   * Only applies when `virtualized` is true.
   * @default 5
   */
  overscan?: number
  /** Content to render inside the list. */
  children?: React.ReactNode
}

const List = forwardRef<HTMLDivElement, ListProps>(
  (
    {
      className,
      viewportRef,
      maxHeight = 342,
      withScrollFade = true,
      virtualized = false,
      estimateSize = 36,
      overscan = 5,
      children,
      ...props
    },
    ref,
  ) => {
    const listScrollContainerRef = useRef<HTMLDivElement | null>(null)
    const mergedViewportRef = useMemo(
      () => mergeRefs(listScrollContainerRef, viewportRef),
      [viewportRef],
    )
    const maxHeightPx =
      typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
    const maxHeightNum =
      typeof maxHeight === 'number' ? maxHeight : Number.parseInt(maxHeight, 10)

    if (virtualized) {
      return (
        <ScrollArea.Root>
          <Primitive.List
            ref={ref}
            className={cn(listVariants(), className)}
            {...props}
          >
            {children}
            <VirtualizedListContent
              maxHeight={maxHeightNum}
              estimateSize={estimateSize}
              overscan={overscan}
              withScrollFade={withScrollFade}
            />
          </Primitive.List>
          <ScrollArea.Scrollbar
            orientation="vertical"
            className={scrollAreaScrollbarVariants()}
          >
            <ScrollArea.Thumb className={scrollAreaThumbVariants()} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      )
    }

    return (
      <ScrollArea.Root>
        <ScrollArea.Viewport
          ref={mergedViewportRef}
          className={scrollAreaViewportVariants({ withScrollFade })}
          style={{ maxHeight: maxHeightPx }}
        >
          <Primitive.List
            ref={ref}
            className={cn(listVariants(), className)}
            render={<ScrollArea.Content />}
            scrollContainerRef={listScrollContainerRef}
            {...props}
          >
            {children}
            <Loading />
            <Empty />
          </Primitive.List>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className={scrollAreaScrollbarVariants()}
        >
          <ScrollArea.Thumb className={scrollAreaThumbVariants()} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    )
  },
)
List.displayName = 'DropdownMenu.List'

const useDataList = Primitive.useDataList

// ============================================================================
// Virtualized List Content (internal)
// ============================================================================

/**
 * Converts DisplayNode[] to VirtualItem[] for store pre-registration.
 * This enables keyboard navigation (Home/End) to work correctly with virtualization
 * by letting the store know about ALL items, not just mounted ones.
 */
function displayNodesToVirtualItems(
  nodes: DisplayNode[],
): DropdownMenuVirtualItem[] {
  const items: DropdownMenuVirtualItem[] = []

  for (const displayNode of nodes) {
    if (isDisplayGroupNode(displayNode)) {
      // Extract items from group
      for (const item of displayNode.items) {
        if (item.node.id) {
          items.push({
            value: item.node.id,
            disabled: item.node.def.disabled ?? false,
            keywords: item.node.def.keywords,
          })
        }
      }
    } else if (isDisplayRadioGroupNode(displayNode)) {
      // Extract items from radio group
      for (const item of displayNode.items) {
        if (item.node.id) {
          items.push({
            value: item.node.id,
            disabled: item.node.def.disabled ?? false,
            keywords: item.node.def.keywords,
          })
        }
      }
    } else if (isDisplaySeparatorNode(displayNode)) {
      // Skip separators - they're not navigable
    } else {
      // Row node (item, checkbox item, submenu)
      if (displayNode.node.id) {
        items.push({
          value: displayNode.node.id,
          disabled: displayNode.node.def.disabled ?? false,
          keywords: displayNode.node.def.keywords,
        })
      }
    }
  }

  return items
}

interface VirtualizedListContentProps {
  maxHeight: number
  estimateSize: number
  overscan: number
  withScrollFade: boolean
}

type NodeRowPositional = {
  first?: boolean
  last?: boolean
  firstInGroup?: boolean
  lastInGroup?: boolean
}

type VirtualizedContentRow =
  | {
      kind: 'node'
      key: string
      node: DisplayNode
      groupId?: string
      positional?: NodeRowPositional
      radioGroup?: RadioGroupDef
    }
  | {
      kind: 'group-label'
      key: string
      groupId: string
      firstGroup: boolean
      lastGroup: boolean
      firstRow: boolean
      lastRow: boolean
      element: React.ReactNode
    }
  | { kind: 'separator'; key: string; node: DisplayNode }
  | {
      kind: 'loading'
      key: '__loading__'
    }
  | {
      kind: 'empty'
      key: '__empty__'
    }

function VirtualizedListContent({
  maxHeight,
  estimateSize,
  overscan,
  withScrollFade,
}: VirtualizedListContentProps) {
  const state = Primitive.useDataList()
  const { nodes, renderNode, count, async: asyncState } = state
  const { store } = useSurfaceContext()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const shouldShowLoadingRow = asyncState.isInitialLoading
  const shouldShowEmptyRow = !asyncState.isInitialLoading && count === 0

  const { rows: virtualizedRows, rowIndexByItemId } = useMemo(() => {
    const rows: VirtualizedContentRow[] = []
    const rowIndexByItemId = new Map<string, number>()

    const groupNodes = nodes.filter(
      (n) => isDisplayGroupNode(n) || isDisplayRadioGroupNode(n),
    )
    const firstGroupNode = groupNodes[0]
    const lastGroupNode = groupNodes[groupNodes.length - 1]

    const pushNodeRow = (
      row: Extract<VirtualizedContentRow, { kind: 'node' }>,
    ) => {
      if (isDisplayRowNode(row.node) && row.node.node.id) {
        rowIndexByItemId.set(row.node.node.id, rows.length)
      }
      rows.push(row)
    }

    for (const node of nodes) {
      if (isDisplayGroupNode(node)) {
        const group = node.node.def
        if (process.env.NODE_ENV !== 'production' && group.render) {
          console.warn(
            `[DropdownMenu.List virtualized] group "${group.id}" has a container render function; it is ignored in virtualized lists. Use renderLabel instead.`,
          )
        }
        if (group.label || group.renderLabel) {
          const labelId = `${group.id}-label`
          rows.push({
            kind: 'group-label',
            key: `group-label-${group.id}`,
            groupId: group.id,
            firstGroup: node === firstGroupNode,
            lastGroup: node === lastGroupNode,
            firstRow: rows.length === 0,
            lastRow: false,
            element: group.renderLabel ? (
              group.renderLabel({
                node: node.node,
                props: { id: labelId },
                context: { ...node.context, label: group.label },
              })
            ) : (
              <GroupLabel id={labelId}>{group.label}</GroupLabel>
            ),
          })
        }
        node.items.forEach((item, i) => {
          pushNodeRow({
            kind: 'node',
            key: getNodeKey(item),
            node: item,
            groupId: group.id,
            positional: {
              firstInGroup: i === 0,
              lastInGroup: i === node.items.length - 1,
            },
          })
        })
      } else if (isDisplayRadioGroupNode(node)) {
        const radioGroup = node.node.def
        if (process.env.NODE_ENV !== 'production' && radioGroup.render) {
          console.warn(
            `[DropdownMenu.List virtualized] radio group "${radioGroup.id}" has a container render function; it is ignored in virtualized lists. Use renderLabel instead.`,
          )
        }
        if (radioGroup.label || radioGroup.renderLabel) {
          const labelId = `${radioGroup.id}-label`
          rows.push({
            kind: 'group-label',
            key: `group-label-${radioGroup.id}`,
            groupId: radioGroup.id,
            firstGroup: node === firstGroupNode,
            lastGroup: node === lastGroupNode,
            firstRow: rows.length === 0,
            lastRow: false,
            element: radioGroup.renderLabel ? (
              radioGroup.renderLabel({
                node: node.node,
                props: { id: labelId },
                context: {
                  ...node.context,
                  label: radioGroup.label,
                  value: radioGroup.value,
                  disabled: radioGroup.disabled ?? false,
                },
              })
            ) : (
              <GroupLabel id={labelId}>{radioGroup.label}</GroupLabel>
            ),
          })
        }
        node.items.forEach((item, i) => {
          pushNodeRow({
            kind: 'node',
            key: getNodeKey(item),
            node: item,
            groupId: radioGroup.id,
            positional: {
              firstInGroup: i === 0,
              lastInGroup: i === node.items.length - 1,
            },
            radioGroup,
          })
        })
      } else if (isDisplaySeparatorNode(node)) {
        rows.push({ kind: 'separator', key: getNodeKey(node), node })
      } else {
        pushNodeRow({ kind: 'node', key: getNodeKey(node), node })
      }
    }

    const nodeRows = rows.filter(
      (r): r is Extract<VirtualizedContentRow, { kind: 'node' }> =>
        r.kind === 'node',
    )
    const firstNodeRow = nodeRows[0]
    const lastNodeRow = nodeRows[nodeRows.length - 1]
    if (firstNodeRow) {
      firstNodeRow.positional = { ...firstNodeRow.positional, first: true }
    }
    if (lastNodeRow) {
      lastNodeRow.positional = { ...lastNodeRow.positional, last: true }
    }

    // A group with no rendered items leaves its label as the trailing row.
    const finalRow = rows[rows.length - 1]
    if (finalRow?.kind === 'group-label') {
      finalRow.lastRow = true
    }

    if (shouldShowLoadingRow) {
      rows.push({ kind: 'loading', key: '__loading__' })
    } else if (shouldShowEmptyRow) {
      rows.push({ kind: 'empty', key: '__empty__' })
    }

    return { rows, rowIndexByItemId }
  }, [nodes, shouldShowLoadingRow, shouldShowEmptyRow])

  // Create stable key function
  const getItemKey = useCallback(
    (index: number) => {
      const row = virtualizedRows[index]
      if (!row) return index
      return row.key
    },
    [virtualizedRows],
  )

  const virtualizerEnabled = useMemo(
    () => virtualizedRows.length > 0,
    [virtualizedRows.length],
  )

  // Create virtualizer
  // Disable flushSync to avoid "flushSync was called from inside a lifecycle method" warning
  // when the list re-renders during search/filtering. This is recommended for React 19+ compatibility.
  const virtualizer = useVirtualizer({
    enabled: virtualizerEnabled,
    count: virtualizedRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const row = virtualizedRows[index]
      if (!row) return estimateSize
      if (row.kind === 'group-label') return 28
      if (row.kind === 'separator') return 9
      return estimateSize
    },
    getItemKey,
    overscan,
    useFlushSync: false,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const previousSearchRef = useRef(state.search)

  React.useLayoutEffect(() => {
    if (previousSearchRef.current === state.search) {
      return
    }

    previousSearchRef.current = state.search

    if (!store.context.resetScrollOnSearch) return
    virtualizer.scrollToOffset(0)
  }, [store, state.search, virtualizer])

  // Convert display nodes to VirtualItem[] for store pre-registration
  const storeVirtualItems = useMemo(
    () => displayNodesToVirtualItems(nodes),
    [nodes],
  )

  // Register virtualization with store - this enables proper Home/End navigation
  // by letting the store know about ALL items (not just mounted ones)
  useEffect(() => {
    store.setVirtualized(true)
    store.setVirtualItems(storeVirtualItems)

    return () => {
      // Cleanup when unmounted
      store.setVirtualized(false)
      store.setVirtualItems([])
    }
  }, [store, storeVirtualItems])

  // Create stable callback for highlight changes to sync virtualizer scroll
  const handleHighlightChange = useCallback(
    (id: string | null, index: number, details: { reason: string }) => {
      // Only scroll for keyboard navigation, not pointer (pointer scrolls naturally)
      // Also check for valid item (index >= 0) and non-null id
      if (id !== null && index >= 0 && details.reason === 'keyboard') {
        const rowIndex = rowIndexByItemId.get(id)
        if (rowIndex === undefined) return
        // Use queueMicrotask to avoid "flushSync" warnings from virtualizer
        queueMicrotask(() => {
          virtualizer.scrollToIndex(rowIndex, { align: 'auto' })
        })
      }
    },
    [virtualizer, rowIndexByItemId],
  )

  // Wire up onHighlightChange callback for scroll sync
  // This is the proper store contract for virtualization (instead of useEffect on highlightedId)
  useEffect(() => {
    store.setOnHighlightChange(handleHighlightChange)
    return () => store.setOnHighlightChange(undefined)
  }, [store, handleHighlightChange])

  // Register list ref with store for scroll behavior
  useEffect(() => {
    store.setListRef(scrollContainerRef as React.RefObject<HTMLElement | null>)
  }, [store])

  return (
    <ScrollArea.Viewport
      ref={scrollContainerRef}
      className={scrollAreaViewportVariants({ withScrollFade })}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <ScrollArea.Content
        style={{
          height: virtualizerEnabled ? `${totalSize}px` : '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const row = virtualizedRows[virtualItem.index]
          if (!row) return null

          let content: React.ReactNode

          if (row.kind === 'node') {
            content = renderNode(row.node)
            if (row.radioGroup) {
              content = (
                <Primitive.RadioGroupValue
                  value={row.radioGroup.value}
                  onValueChange={row.radioGroup.onValueChange}
                  disabled={row.radioGroup.disabled ?? false}
                >
                  {content}
                </Primitive.RadioGroupValue>
              )
            }
            if (row.groupId || row.positional) {
              content = (
                <Primitive.GroupValue
                  groupId={row.groupId}
                  positional={row.positional}
                >
                  {content}
                </Primitive.GroupValue>
              )
            }
          } else if (row.kind === 'group-label') {
            content = (
              <Primitive.GroupValue
                groupId={row.groupId}
                positional={{
                  first: row.firstRow,
                  last: row.lastRow,
                  firstGroup: row.firstGroup,
                  lastGroup: row.lastGroup,
                }}
              >
                {row.element}
              </Primitive.GroupValue>
            )
          } else if (row.kind === 'separator') {
            content = renderNode(row.node)
          } else if (row.kind === 'loading') {
            content = <Loading />
          } else {
            content = <Empty />
          }

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {content}
            </div>
          )
        })}
      </ScrollArea.Content>
    </ScrollArea.Viewport>
  )
}

/** Return a display node's canonical resolved identity. */
function getNodeKey(displayNode: DisplayNode): string {
  return displayNode.node.id
}

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.Input>
>(({ className, placeholder = 'Search...', ...props }, ref) => {
  const ac = useMaybeAsyncMenuCoordinator()

  const showInlineLoading = React.useMemo(
    () => ac && !ac.isAnyInitialLoading && ac.isAnyRefetching,
    [ac, ac?.isAnyInitialLoading, ac?.isAnyRefetching],
  )

  return (
    <Primitive.Input
      ref={ref}
      className={cn(inputVariants(), className)}
      placeholder={placeholder}
      render={(props) => (
        <div className="flex items-center justify-between pr-4">
          <input {...props} />
          <div className="size-4 shrink-0">
            {showInlineLoading && <DiamondSpinner className="size-4" />}
          </div>
        </div>
      )}
      {...props}
    />
  )
})
Input.displayName = 'DropdownMenu.Input'

const Item = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(menuItemVariants({ variant: 'item' }), className)}
    {...props}
  />
))
Item.displayName = 'DropdownMenu.Item'

const Tree = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Tree>
>(({ className, ...props }, ref) => (
  <Primitive.Tree ref={ref} className={cn(className)} {...props} />
))
Tree.displayName = 'DropdownMenu.Tree'

const TreeItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.TreeItem>
>(({ className, ...props }, ref) => (
  <Primitive.TreeItem
    ref={ref}
    className={cn(menuItemVariants({ variant: 'item' }), className)}
    {...props}
  />
))
TreeItem.displayName = 'DropdownMenu.TreeItem'

/**
 * Inline tree connector, matching Linear's team picker. Rendered as the first
 * in-flow child of a `TreeItem`: its width provides the indentation (one level
 * per unit) and it draws the rails/hook in its own box — no absolute overlay
 * across the row. The vertical rail is full-height for a middle child (so
 * siblings connect) or stops at center for the last child; the elbow into the
 * row is a filled curved path rather than a square `border` corner.
 */
export function TreeConnector({
  tree,
  className,
}: {
  tree: {
    depth: number
    hasChildren: boolean
    isLastChild: boolean
    ancestorsLast: boolean[]
    header: boolean
  }
  className?: string
}) {
  // x-position of the rail for a given depth level, within this connector box.
  const railX = (level: number) => `calc(${level - 1} * 1rem + 0.5rem)`

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative shrink-0 self-stretch text-neutral-300/75 dark:text-neutral-700',
        className,
      )}
      style={{ width: `calc(${tree.depth} * 1rem)` }}
    >
      {/* Pass-through rails for ancestors that still have siblings below. */}
      {tree.ancestorsLast.map((isLast, level) =>
        level > 0 && !isLast ? (
          <span
            key={`rail-${tree.ancestorsLast.slice(0, level + 1).join('-')}`}
            className="absolute top-0 bottom-0 w-px bg-current"
            style={{ left: railX(level) }}
          />
        ) : null,
      )}

      {/* This row's own vertical rail. Middle children run full height so
          siblings connect; the last child stops where the hook's curve begins
          (hook is 9px tall, bottom at center) so the straight line doesn't
          overshoot past the corner. */}
      <span
        className="absolute top-0 w-px bg-current"
        style={{
          left: railX(tree.depth),
          bottom: tree.isLastChild ? 'calc(50% + 9px)' : 0,
        }}
      />

      {/* Curved elbow from the rail into the row (Linear's hook path). */}
      <svg
        width="10"
        height="9"
        viewBox="0 0 10 9"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        className="absolute bottom-1/2"
        style={{ left: railX(tree.depth) }}
      >
        <path d="M0 0h1v1c0 2.5 2.212 3.546 2.212 3.546L9.737 8.06c.568.306.094 1.186-.474.88l-6.48-3.488S0 4 0 1V0Z" />
      </svg>
    </span>
  )
}

const CheckboxItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItem>
>(({ className, checked, onCheckedChange, children, ...props }, ref) => (
  <Primitive.CheckboxItem
    ref={ref}
    checked={checked}
    onCheckedChange={onCheckedChange}
    className={cn(menuItemVariants({ variant: 'checkbox' }), className)}
    {...props}
  >
    {children}
  </Primitive.CheckboxItem>
))
CheckboxItem.displayName = 'DropdownMenu.CheckboxItem'

const CheckboxItemIndicator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItemIndicator>
>(({ className, keepMounted = true, ...props }, ref) => (
  <Primitive.CheckboxItemIndicator
    ref={ref}
    className={cn(
      'flex items-center justify-center shrink-0 relative',
      "after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']",
      className,
    )}
    keepMounted={keepMounted}
    render={(props, state) => (
      <Checkbox
        {...props}
        checked={state.checked}
        onClick={(e) => {
          e.stopPropagation()
          state.toggle()
        }}
      />
    )}
    {...props}
  />
))

const RadioGroup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.RadioGroup>
>(({ className, ...props }, ref) => (
  <Primitive.RadioGroup
    ref={ref}
    className={cn(
      'first:[&_[bazzaui-dropdown-menu-group-label]]:mt-2',
      className,
    )}
    {...props}
  />
))

const RadioGroupValue = Primitive.RadioGroupValue

const RadioItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.RadioItem>
>(({ className, ...props }, ref) => (
  <Primitive.RadioItem
    ref={ref}
    className={cn(menuItemVariants({ variant: 'radio' }), className)}
    {...props}
  />
))
RadioItem.displayName = 'DropdownMenu.RadioItem'

const RadioItemIndicator = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.RadioItemIndicator>
>(({ className, children, ...props }, ref) => (
  <Primitive.RadioItemIndicator
    ref={ref}
    keepMounted
    className={cn(
      'size-4 flex items-center justify-center shrink-0 text-transparent data-checked:text-primary/75 data-checked:data-highlighted:text-primary',
      className,
    )}
    {...props}
  >
    {children ?? <CheckIcon className="size-5 shrink-0 " />}
  </Primitive.RadioItemIndicator>
))
RadioItemIndicator.displayName = 'DropdownMenu.RadioItemIndicator'

const Separator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Separator>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    ref={ref}
    className={cn('h-px w-full bg-border my-1', className)}
    {...props}
  />
))
Separator.displayName = 'DropdownMenu.Separator'

const Group = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Group>
>(({ className, ...props }, ref) => (
  <Primitive.Group ref={ref} className={className} {...props} />
))
Group.displayName = 'DropdownMenu.Group'

const GroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    className={cn(
      'mt-3 mb-1',
      'text-xs font-medium text-muted-foreground px-4',
      className,
    )}
    {...props}
  />
))
GroupLabel.displayName = 'DropdownMenu.GroupLabel'

const Header = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Header>
>(({ className, ...props }, ref) => (
  <Primitive.Header
    ref={ref}
    className={cn(headerVariants(), className)}
    {...props}
  />
))
Header.displayName = 'DropdownMenu.Header'

const Footer = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Footer>
>(({ className, ...props }, ref) => (
  <Primitive.Footer
    ref={ref}
    className={cn(footerVariants(), className)}
    {...props}
  />
))
Footer.displayName = 'DropdownMenu.Footer'

function Submenu({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Primitive.Submenu>) {
  const handleOpenChange = useCallback(
    (
      open: boolean,
      eventDetails: Parameters<
        NonNullable<
          React.ComponentProps<typeof Primitive.Submenu>['onOpenChange']
        >
      >[1],
    ) => {
      // Prevent closing when clicking on feedback toolbar elements
      if (
        !open &&
        (eventDetails.reason === 'outside-press' ||
          eventDetails.reason === 'focus-out') &&
        eventDetails.event
      ) {
        const target = eventDetails.event.target as Element | null
        const feedbackToolbar = target?.closest(
          '[data-feedback-toolbar="true"]',
        )
        if (feedbackToolbar) {
          eventDetails.cancel()
          return
        }
      }
      onOpenChange?.(open, eventDetails)
    },
    [onOpenChange],
  )

  return <Primitive.Submenu onOpenChange={handleOpenChange} {...props} />
}

const SubmenuTrigger = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubmenuTrigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubmenuTrigger
    ref={ref}
    className={cn(menuItemVariants({ variant: 'submenuTrigger' }), className)}
    {...props}
  >
    {children}

    <Primitive.SubmenuTriggerIndicator
      className={cn(
        'size-4 shrink-0 text-muted-foreground/50',
        'group-data-[popup-open]/row:text-muted-foreground',
        'group-data-[popup-open]/row:group-data-[popup-focused]/row:text-foreground',
        'transition-colors duration-50 ease-out',
      )}
    >
      <TriangleRightIcon className="size-4" />
    </Primitive.SubmenuTriggerIndicator>
  </Primitive.SubmenuTrigger>
))
SubmenuTrigger.displayName = 'DropdownMenu.SubmenuTrigger'

const SubmenuTriggerIndicator = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.SubmenuTriggerIndicator>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubmenuTriggerIndicator
    ref={ref}
    className={cn(
      'size-4 shrink-0 text-muted-foreground/50',
      'group-data-[popup-open]/row:text-muted-foreground',
      'group-data-[highlighted]/row:text-foreground',
      'transition-colors duration-50 ease-out',
      className,
    )}
    {...props}
  >
    {children ?? <TriangleRightIcon className="size-4" />}
  </Primitive.SubmenuTriggerIndicator>
))
SubmenuTriggerIndicator.displayName = 'DropdownMenu.SubmenuTriggerIndicator'

const Subpage = Primitive.Subpage

const SubpageTrigger = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubpageTrigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubpageTrigger
    ref={ref}
    className={cn(menuItemVariants({ variant: 'item' }), className)}
    {...props}
  >
    {children}
  </Primitive.SubpageTrigger>
))
SubpageTrigger.displayName = 'DropdownMenu.SubpageTrigger'

const SubpageBackItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubpageBackItem>
>(({ className, ...props }, ref) => (
  <Primitive.SubpageBackItem
    ref={ref}
    className={cn(menuItemVariants({ variant: 'subpageBackItem' }), className)}
    {...props}
  />
))
SubpageBackItem.displayName = 'DropdownMenu.SubpageBackItem'

const SubpageBack = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Primitive.SubpageBack>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubpageBack
    ref={ref}
    className={cn(subpageBackVariants(), className)}
    {...props}
  >
    {children ?? (
      <>
        <ChevronLeftIcon className="size-3.5 shrink-0" />
        Back
      </>
    )}
  </Primitive.SubpageBack>
))
SubpageBack.displayName = 'DropdownMenu.SubpageBack'

const Empty = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Empty>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Empty
    ref={ref}
    className={cn(
      'flex items-center justify-center h-8 text-muted-foreground text-sm',
      className,
    )}
    {...props}
  >
    {children ?? 'No matching options.'}
  </Primitive.Empty>
))
Empty.displayName = 'DropdownMenu.Empty'

const Loading = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Loading>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Loading
    ref={ref}
    className={cn(
      'flex items-center justify-center h-8 text-muted-foreground text-sm',
      className,
    )}
    {...props}
  >
    {children ?? <DiamondSpinner className="size-5" />}
  </Primitive.Loading>
))
Loading.displayName = 'DropdownMenu.Loading'

const Arrow = Primitive.Arrow

const Backdrop = Primitive.Backdrop

const FocusZone = Primitive.FocusZone

const Shortcut = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Shortcut>
>(({ className, ...props }, ref) => (
  <Primitive.Shortcut
    ref={ref}
    className={cn('ml-auto text-xs text-muted-foreground', className)}
    {...props}
  />
))
Shortcut.displayName = 'DropdownMenu.Shortcut'

const Icon = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Icon>
>(({ className, ...props }, ref) => (
  <Primitive.Icon
    ref={ref}
    className={cn(
      'min-h-4 min-w-4 size-4 flex items-center justify-center shrink-0',
      'text-muted-foreground group-data-[highlighted]/row:text-primary',
      className,
    )}
    {...props}
  />
))
Icon.displayName = 'DropdownMenu.Icon'

const ScrollUpArrow = Primitive.ScrollUpArrow

const ScrollDownArrow = Primitive.ScrollDownArrow

// ============================================================================
// Compound Export
// ============================================================================

export const DropdownMenu = {
  Root,
  Trigger,
  Portal,
  Positioner,
  Popup,
  Surface,
  List,
  useDataList,
  Input,
  Item,
  Tree,
  TreeItem,
  TreeConnector,
  CheckboxItem,
  CheckboxItemIndicator,
  RadioGroup,
  RadioGroupValue,
  RadioItem,
  RadioItemIndicator,
  Separator,
  Group,
  GroupLabel,
  Header,
  Footer,
  FocusZone,
  Submenu,
  SubmenuTrigger,
  SubmenuTriggerIndicator,
  Subpage,
  SubpageTrigger,
  SubpageBackItem,
  SubpageBack,
  Empty,
  Loading,
  Arrow,
  Backdrop,
  Shortcut,
  Icon,
  ScrollUpArrow,
  ScrollDownArrow,
}

// ============================================================================
// Utility Components
// ============================================================================

// Triangle Right Icon (for submenu indicators)
export const TriangleRightIcon = ({
  ...props
}: React.HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor" />
    </svg>
  )
}

// Braille-style morphing spinner (loading -> success)
type BrailleMorphMode = 'loading' | 'success'

type BrailleGridCell = {
  row: number
  col: number
}

type BraillePoint = {
  x: number
  y: number
}

const toBrailleCellKey = (cell: BrailleGridCell) => `${cell.row}:${cell.col}`

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function createDiamondGridCells(
  rows: number,
  cols: number,
  radius: number,
): BrailleGridCell[] {
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)
  const cells: BrailleGridCell[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol)

      if (distance <= radius) {
        cells.push({ row, col })
      }
    }
  }

  return cells
}

function createDiamondLoadingPath(
  rows: number,
  cols: number,
  radius: number,
): BrailleGridCell[] {
  const centerRow = Math.floor(rows / 2)
  const centerCol = Math.floor(cols / 2)

  const ring = createDiamondGridCells(rows, cols, radius).filter((cell) => {
    const distance =
      Math.abs(cell.row - centerRow) + Math.abs(cell.col - centerCol)

    return distance === radius
  })

  if (ring.length === 0) {
    return []
  }

  const sortedByAngle = [...ring].sort((a, b) => {
    const aAngle = Math.atan2(a.row - centerRow, a.col - centerCol)
    const bAngle = Math.atan2(b.row - centerRow, b.col - centerCol)
    return aAngle - bAngle
  })

  const startIndex = sortedByAngle.findIndex((cell) => {
    return cell.col === centerCol - radius && cell.row === centerRow
  })

  if (startIndex === -1) {
    return sortedByAngle
  }

  return [
    ...sortedByAngle.slice(startIndex),
    ...sortedByAngle.slice(0, startIndex),
  ]
}

function sampleLinePoints(
  from: BraillePoint,
  to: BraillePoint,
  count: number,
  includeStart: boolean,
): BraillePoint[] {
  const safeCount = Math.max(2, count)
  const points: BraillePoint[] = []

  for (let i = 0; i < safeCount; i += 1) {
    if (!includeStart && i === 0) {
      continue
    }

    const t = i / (safeCount - 1)
    points.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    })
  }

  return points
}

export interface BrailleMorphSpinnerProps
  extends React.SVGProps<SVGSVGElement> {
  mode?: BrailleMorphMode
  rows?: number
  cols?: number
  gridRadius?: number
  dotSize?: number
  gap?: number
  loadingDotSize?: number
  successDotSize?: number
  loadingTrailLength?: number
  loadingFrameDurationMs?: number
  successFadeDurationMs?: number
  rotateDurationMs?: number
  successDrawDurationMs?: number
  successDrawStaggerMs?: number
  checkShortArm?: number
  checkLongArm?: number
  checkPivotRow?: number
  checkPivotCol?: number
}

export const BrailleMorphSpinner = ({
  className,
  mode = 'loading',
  rows = 7,
  cols = 7,
  gridRadius,
  dotSize = 7,
  gap = 8,
  loadingDotSize = 9,
  successDotSize = 10,
  loadingTrailLength = 5,
  loadingFrameDurationMs = 80,
  successFadeDurationMs = 180,
  rotateDurationMs = 240,
  successDrawDurationMs = 260,
  successDrawStaggerMs = 70,
  checkShortArm = 3,
  checkLongArm = 4,
  checkPivotRow,
  checkPivotCol,
  ...props
}: BrailleMorphSpinnerProps) => {
  const [loadingFrame, setLoadingFrame] = React.useState(0)
  const [successPhase, setSuccessPhase] = React.useState<
    'idle' | 'fading' | 'drawing'
  >(() => (mode === 'success' ? 'drawing' : 'idle'))
  const previousModeRef = React.useRef<BrailleMorphMode>(mode)

  const safeRows = Math.max(3, rows)
  const safeCols = Math.max(3, cols)
  const resolvedRadius = clamp(
    gridRadius ?? Math.floor(Math.min(safeRows, safeCols) / 2),
    1,
    Math.floor(Math.min(safeRows, safeCols) / 2),
  )

  const centerRow = Math.floor(safeRows / 2)
  const centerCol = Math.floor(safeCols / 2)

  const resolvedPivotRow = clamp(
    checkPivotRow ?? Math.min(safeRows - 1, centerRow + 2),
    0,
    safeRows - 1,
  )
  const resolvedPivotCol = clamp(checkPivotCol ?? centerCol, 0, safeCols - 1)

  const step = dotSize + gap
  const maxDotSize = Math.max(dotSize, loadingDotSize, successDotSize)
  const padding = Math.ceil(maxDotSize / 2) + 1
  const viewWidth = padding * 2 + step * (safeCols - 1)
  const viewHeight = padding * 2 + step * (safeRows - 1)

  const getRectProps = useCallback(
    (size: number, cell: BrailleGridCell) => {
      const centerX = padding + cell.col * step
      const centerY = padding + cell.row * step

      return {
        x: centerX - size / 2,
        y: centerY - size / 2,
        width: size,
        height: size,
      }
    },
    [padding, step],
  )

  const getPointRectProps = useCallback((size: number, point: BraillePoint) => {
    return {
      x: point.x - size / 2,
      y: point.y - size / 2,
      width: size,
      height: size,
    }
  }, [])

  const baseCells = useMemo(() => {
    return createDiamondGridCells(safeRows, safeCols, resolvedRadius)
  }, [safeRows, safeCols, resolvedRadius])

  const loadingPath = useMemo(() => {
    return createDiamondLoadingPath(safeRows, safeCols, resolvedRadius)
  }, [safeRows, safeCols, resolvedRadius])

  const checkPivotPoint = useMemo(() => {
    const xOffset = step * 0.25

    return {
      x: clamp(
        padding + resolvedPivotCol * step - xOffset,
        padding,
        viewWidth - padding,
      ),
      y: padding + resolvedPivotRow * step,
    }
  }, [padding, resolvedPivotCol, resolvedPivotRow, step, viewWidth])

  const successPoints = useMemo(() => {
    const start: BraillePoint = {
      x: clamp(checkPivotPoint.x - step * 1.35, padding, viewWidth - padding),
      y: clamp(checkPivotPoint.y - step * 1.2, padding, viewHeight - padding),
    }
    const end: BraillePoint = {
      x: clamp(checkPivotPoint.x + step * 2.7, padding, viewWidth - padding),
      y: clamp(checkPivotPoint.y - step * 3.6, padding, viewHeight - padding),
    }

    const shortArmPointCount = Math.max(2, checkShortArm)
    const longArmPointCount = Math.max(3, checkLongArm + 1)

    return [
      ...sampleLinePoints(start, checkPivotPoint, shortArmPointCount, true),
      ...sampleLinePoints(checkPivotPoint, end, longArmPointCount, false),
    ]
  }, [
    checkPivotPoint,
    step,
    padding,
    viewWidth,
    viewHeight,
    checkShortArm,
    checkLongArm,
  ])

  const loadingTrailByKey = useMemo(() => {
    const byKey = new Map<string, number>()

    if (loadingPath.length === 0) {
      return byKey
    }

    const pathLength = loadingPath.length
    const trailLength = clamp(loadingTrailLength, 1, pathLength)

    for (let trailIndex = 0; trailIndex < trailLength; trailIndex += 1) {
      const pathIndex =
        (loadingFrame - trailIndex + pathLength * 8) % pathLength
      const cell = loadingPath[pathIndex]
      const opacity = 1 - trailIndex / (trailLength + 1)

      if (!cell) {
        continue
      }

      byKey.set(toBrailleCellKey(cell), opacity)
    }

    return byKey
  }, [loadingPath, loadingFrame, loadingTrailLength])

  React.useEffect(() => {
    if (mode !== 'loading' || loadingPath.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setLoadingFrame((frame) => (frame + 1) % loadingPath.length)
    }, loadingFrameDurationMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [mode, loadingPath, loadingFrameDurationMs])

  React.useEffect(() => {
    if (mode === previousModeRef.current) {
      return
    }

    if (mode === 'success') {
      setSuccessPhase('fading')

      const timeoutId = window.setTimeout(() => {
        setSuccessPhase('drawing')
      }, successFadeDurationMs)

      previousModeRef.current = mode

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    setSuccessPhase('idle')
    previousModeRef.current = mode
  }, [mode, successFadeDurationMs])

  return (
    <svg
      className={cn('fill-current size-6', className)}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          @keyframes braille-grid-to-square {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(45deg);
            }
          }

          @keyframes braille-loading-fade-out {
            0% {
              opacity: var(--from-opacity, 1);
            }
            100% {
              opacity: 0;
            }
          }

          @keyframes braille-check-in {
            0% {
              opacity: 0;
              transform: scale(0.4);
            }
            60% {
              opacity: 1;
              transform: scale(1.12);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      <g
        key={mode === 'success' ? 'success' : 'loading'}
        style={
          mode === 'success' && successPhase === 'drawing'
            ? {
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `braille-grid-to-square ${rotateDurationMs}ms cubic-bezier(.2,.8,.3,1) forwards`,
              }
            : undefined
        }
      >
        {baseCells.map((cell) => (
          <rect
            key={`bg-${toBrailleCellKey(cell)}`}
            className="fill-current/20"
            {...getRectProps(dotSize, cell)}
          />
        ))}

        {mode === 'loading' &&
          baseCells.map((cell) => {
            const opacity = loadingTrailByKey.get(toBrailleCellKey(cell))

            if (opacity === undefined) {
              return null
            }

            return (
              <rect
                key={`loading-${toBrailleCellKey(cell)}`}
                {...getRectProps(loadingDotSize, cell)}
                style={{ opacity }}
              />
            )
          })}

        {mode === 'success' &&
          successPhase === 'fading' &&
          baseCells.map((cell) => {
            const opacity = loadingTrailByKey.get(toBrailleCellKey(cell))

            if (opacity === undefined) {
              return null
            }

            return (
              <rect
                key={`fade-${toBrailleCellKey(cell)}`}
                {...getRectProps(loadingDotSize, cell)}
                style={{
                  opacity,
                  ['--from-opacity' as string]: opacity,
                  animation: `braille-loading-fade-out ${successFadeDurationMs}ms ease-out forwards`,
                }}
              />
            )
          })}
      </g>

      {mode === 'success' &&
        successPhase === 'drawing' &&
        successPoints.map((point, index) => (
          <rect
            key={`success-${point.x.toFixed(2)}-${point.y.toFixed(2)}`}
            {...getPointRectProps(successDotSize, point)}
            style={{
              opacity: 0,
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: `braille-check-in ${successDrawDurationMs}ms cubic-bezier(.2,.8,.3,1) forwards`,
              animationDelay: `${rotateDurationMs + index * successDrawStaggerMs}ms`,
            }}
          />
        ))}
    </svg>
  )
}

export const DiamondSpinner = ({
  className,
  ...props
}: Omit<React.SVGProps<SVGSVGElement>, 'mode'>) => {
  return <BrailleMorphSpinner className={className} {...props} mode="loading" />
}

export const DiamondCheckmark = ({
  className,
  ...props
}: Omit<React.SVGProps<SVGSVGElement>, 'mode'>) => {
  return <BrailleMorphSpinner className={className} {...props} mode="success" />
}

// Label with Breadcrumbs (for search results showing path)
export const LabelWithBreadcrumbs = ({
  label,
  breadcrumbs,
  classNames,
}: {
  label: React.ReactNode
  breadcrumbs?: BreadcrumbNode[]
  classNames?: {
    label?: string
    breadcrumb?: string
    separator?: string
  }
}) => (
  // data-measuring:w-max not-data-measuring:w-[min(500px,max(var(--row-width),200px))]

  <div className="flex items-center gap-1 truncate ">
    {breadcrumbs?.map((crumb) => (
      <Fragment key={crumb.id ?? crumb.value}>
        <span
          className={cn(
            'text-muted-foreground not-data-measuring:truncate data-measuring:w-max',
            classNames?.breadcrumb,
          )}
        >
          {crumb.value}
        </span>
        <ChevronRightIcon
          className={cn(
            'size-3 text-muted-foreground/75 stroke-[2.5px] shrink-0',
            classNames?.separator,
          )}
        />
      </Fragment>
    ))}
    <span
      className={cn(
        'not-data-measuring:truncate data-measuring:w-max',
        'text-primary/90 group-data-[highlighted]/row:text-primary',
        classNames?.label,
      )}
    >
      {label}
    </span>
  </div>
)

// Check Icon (for radio items)
export { CheckIcon }
