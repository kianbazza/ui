'use client'

import { ScrollArea } from '@base-ui/react/scroll-area'
import { CommandMenu as Primitive } from '@bazza-ui/react/command-menu'
import { Kbd as KbdPrimitive } from '@bazza-ui/react/kbd'
import { cva } from 'class-variance-authority'
import { ChevronLeftIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type * as React from 'react'
import { forwardRef, useEffect, useMemo, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { mergeRefs } from '@/lib/merge-refs'
import { cn } from '@/lib/utils'
import { LabelWithBreadcrumbs } from '../dropdown-menu'

const menuItemVariants = cva(
  [
    'group group/row flex items-center text-sm select-none cursor-default',
    'text-primary/90 data-[highlighted]:text-primary',
    'h-10 px-4',
    'w-full gap-2',
    'overflow-hidden',
    'relative z-[1]',
    'before:absolute before:top-0 before:inset-x-1.5 before:h-full before:rounded-md before:z-[-1]',
    'data-[highlighted]:before:bg-accent',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 aria-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        item: '',
        checkbox: '',
        subpageTrigger: 'justify-between',
        subpageBackItem: '',
      },
    },
    defaultVariants: {
      variant: 'item',
    },
  },
)

const inputVariants = cva([
  'h-12 w-full border-0 border-b bg-transparent px-4 text-sm outline-none',
  'placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'caret-blue-500',
])

const listVariants = cva(['outline-none py-1.5'])

const scrollAreaViewportVariants = cva('scroll-py-1.5 overscroll-none', {
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

const kbdKeyVariants = cva([
  'inline-flex h-5 min-w-5 items-center justify-center',
  'rounded-md bg-transparent border px-1 font-medium leading-none text-muted-foreground',
])

const headerVariants = cva([
  'flex items-center justify-between border-b px-4 py-2',
  'text-xs font-medium text-muted-foreground',
])

const footerVariants = cva([
  'flex items-center justify-end gap-2 border-t px-4 py-2',
  'text-xs font-medium text-muted-foreground',
])

const Root = Primitive.Root

const Trigger = Primitive.Trigger

// const Trigger = forwardRef<
//   HTMLButtonElement,
//   React.ComponentProps<typeof Primitive.Trigger>
// >(({ className, ...props }, ref) => (
//   <Primitive.Trigger
//     ref={ref}
//     className={cn(
//       'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium outline-none',
//       'focus-visible:ring-1 focus-visible:ring-ring',
//       'disabled:pointer-events-none disabled:opacity-50',
//       className,
//     )}
//     {...props}
//   />
// ))
// Trigger.displayName = 'CommandMenu.Trigger'

const Portal = Primitive.Portal

const Backdrop = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Backdrop>
>(({ className, ...props }, ref) => (
  <Primitive.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/0',
      'opacity-100 transition-opacity duration-150 ease-out',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
      className,
    )}
    {...props}
  />
))
Backdrop.displayName = 'CommandMenu.Backdrop'

/**
 * Animates the popup's height to follow its content (e.g. when navigating
 * between subpages or filtering). A ResizeObserver watches every element
 * child of the popup — not a single content wrapper, because the primitive
 * renders data-first subpage surfaces as *siblings* of the wrapper's
 * children — sums their heights into `--popup-height`, and CSS transitions
 * the height. A MutationObserver re-wires the ResizeObserver when children
 * mount/unmount (page changes swap elements in and out).
 */
function usePopupHeightAnimation() {
  const popupRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const popup = popupRef.current
    if (!popup || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      let height = 0
      for (const child of popup.children) {
        const element = child as HTMLElement
        // Skip Base UI's inert focus guards and anything taken out of flow.
        if (element.hasAttribute('data-base-ui-focus-guard')) continue
        if (getComputedStyle(element).position === 'fixed') continue
        height += element.offsetHeight
      }
      popup.style.setProperty('--popup-height', `${height}px`)
    }

    const resizeObserver = new ResizeObserver(measure)

    const observeChildren = () => {
      resizeObserver.disconnect()
      for (const child of popup.children) {
        resizeObserver.observe(child)
      }
      measure()
    }

    const mutationObserver = new MutationObserver(observeChildren)
    mutationObserver.observe(popup, { childList: true })
    observeChildren()

    return () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [])

  return popupRef
}

const Popup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Popup>
>(({ className, ...props }, ref) => {
  const popupRef = usePopupHeightAnimation()
  const mergedRef = useMemo(() => mergeRefs(popupRef, ref), [popupRef, ref])

  return (
    <Primitive.Popup
      ref={mergedRef}
      className={(state) =>
        cn(
          'fixed top-[20%] left-1/2 z-50 -translate-x-1/2',
          'w-[min(640px,90vw)] rounded-xl border bg-popover text-popover-foreground drop-shadow-2xl',
          'overflow-hidden outline-none',
          // Height follows content via --popup-height (set by ResizeObserver);
          // falls back to auto before the first measurement.
          'h-[var(--popup-height,auto)]',
          'opacity-100 scale-100 transition-[opacity,scale,height] duration-150 ease-out',
          'motion-reduce:transition-none',
          'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
          'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
          typeof className === 'function' ? className(state) : className,
        )
      }
      render={(renderProps) => (
        <motion.div
          {...(renderProps as React.ComponentProps<typeof motion.div>)}
        />
      )}
      {...props}
    />
  )
})
Popup.displayName = 'CommandMenu.Popup'

const Surface = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Surface>
>(({ className, clearSearchOnClose = 'after-exit', ...props }, ref) => (
  <Primitive.Surface
    ref={ref}
    className={cn(className)}
    clearSearchOnClose={clearSearchOnClose}
    {...props}
  />
))
Surface.displayName = 'CommandMenu.Surface'

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
Header.displayName = 'CommandMenu.Header'

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
Footer.displayName = 'CommandMenu.Footer'

const FocusZone = Primitive.FocusZone

const Input = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Primitive.Input>
>(
  (
    { className, placeholder = 'Type a command or search...', ...props },
    ref,
  ) => (
    <Primitive.Input
      ref={ref}
      className={cn(inputVariants(), className)}
      placeholder={placeholder}
      {...props}
    />
  ),
)
Input.displayName = 'CommandMenu.Input'

export interface ListProps
  extends Omit<React.ComponentProps<typeof Primitive.List>, 'render'> {
  viewportRef?: React.Ref<HTMLDivElement>
  /** Maximum height of the scrollable area. */
  maxHeight?: string | number
  /** Whether to show gradient fade at scroll edges. */
  withScrollFade?: boolean
}

const List = forwardRef<HTMLDivElement, ListProps>(
  (
    {
      className,
      viewportRef,
      maxHeight = 'min(420px, 60vh)',
      withScrollFade = true,
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
List.displayName = 'CommandMenu.List'

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
Item.displayName = 'CommandMenu.Item'

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
CheckboxItem.displayName = 'CommandMenu.CheckboxItem'

const CheckboxItemIndicator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.CheckboxItemIndicator>
>(({ className, keepMounted = true, ...props }, ref) => (
  <Primitive.CheckboxItemIndicator
    ref={ref}
    className={cn(
      'flex items-center justify-center shrink-0 relative',
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
CheckboxItemIndicator.displayName = 'CommandMenu.CheckboxItemIndicator'

const Group = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Group>
>(({ className, ...props }, ref) => (
  <Primitive.Group ref={ref} className={cn(className)} {...props} />
))
Group.displayName = 'CommandMenu.Group'

const GroupLabel = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    className={cn(
      'px-4 py-1.5 text-xs font-medium text-muted-foreground',
      className,
    )}
    {...props}
  />
))
GroupLabel.displayName = 'CommandMenu.GroupLabel'

const Separator = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.Separator>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    ref={ref}
    className={cn('my-1 h-px w-full bg-border', className)}
    {...props}
  />
))
Separator.displayName = 'CommandMenu.Separator'

const Empty = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Empty>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Empty
    ref={ref}
    className={cn(
      'flex h-10 items-center justify-center text-sm text-muted-foreground',
      className,
    )}
    {...props}
  >
    {children ?? 'No commands found.'}
  </Primitive.Empty>
))
Empty.displayName = 'CommandMenu.Empty'

const Loading = forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Primitive.Loading>, 'children'> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <Primitive.Loading
    ref={ref}
    className={cn(
      'flex h-10 items-center justify-center text-sm text-muted-foreground',
      className,
    )}
    {...props}
  >
    {children ?? 'Loading...'}
  </Primitive.Loading>
))
Loading.displayName = 'CommandMenu.Loading'

const Shortcut = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Shortcut>
>(({ className, ...props }, ref) => (
  <Primitive.Shortcut
    ref={ref}
    className={cn(
      'ml-auto flex items-center gap-1 pl-4 text-xs text-muted-foreground',
      className,
    )}
    {...props}
  />
))
Shortcut.displayName = 'CommandMenu.Shortcut'

const Icon = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof Primitive.Icon>
>(({ className, ...props }, ref) => (
  <Primitive.Icon
    ref={ref}
    className={cn(
      'flex size-4 shrink-0 items-center justify-center text-muted-foreground',
      'group-data-[highlighted]/row:text-primary',
      className,
    )}
    {...props}
  />
))
Icon.displayName = 'CommandMenu.Icon'

const Subpage = Primitive.Subpage

const SubpageTrigger = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Primitive.SubpageTrigger>
>(({ className, ...props }, ref) => (
  <Primitive.SubpageTrigger
    ref={ref}
    className={cn(menuItemVariants({ variant: 'subpageTrigger' }), className)}
    {...props}
  />
))
SubpageTrigger.displayName = 'CommandMenu.SubpageTrigger'

const SubpageBack = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Primitive.SubpageBack>
>(({ className, children, ...props }, ref) => (
  <Primitive.SubpageBack
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground',
      'transition-colors duration-100 ease-out hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
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
SubpageBack.displayName = 'CommandMenu.SubpageBack'

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
SubpageBackItem.displayName = 'CommandMenu.SubpageBackItem'

const KbdRoot = forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof KbdPrimitive.Root>
>(({ className, ...props }, ref) => (
  <KbdPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 text-muted-foreground *:font-sans',
      '[&_[data-kbd-key]]:inline-flex [&_[data-kbd-key]]:h-5.5 [&_[data-kbd-key]]:min-w-5.5',
      '[&_[data-kbd-key]]:items-center [&_[data-kbd-key]]:justify-center',
      '[&_[data-kbd-key]]:rounded-sm [&_[data-kbd-key]]:border',
      '[&_[data-kbd-key]]:px-1 [&_[data-kbd-key]]:text-xs',
      '[&_[data-kbd-key]]:font-medium [&_[data-kbd-key]]:leading-none [&_[data-kbd-key]]:text-muted-foreground',
      '[&_[data-kbd-separator]]:text-xs [&_[data-kbd-separator]]:text-muted-foreground/70',
      className,
    )}
    {...props}
  />
))
KbdRoot.displayName = 'CommandMenu.Kbd.Root'

const KbdKey = forwardRef<
  HTMLElement,
  React.ComponentProps<typeof KbdPrimitive.Key>
>(({ className, ...props }, ref) => (
  <KbdPrimitive.Key
    ref={ref}
    className={cn(kbdKeyVariants(), className)}
    {...props}
  />
))
KbdKey.displayName = 'CommandMenu.Kbd.Key'

const Kbd = Object.assign(KbdRoot, {
  Root: KbdRoot,
  Key: KbdKey,
})

export { LabelWithBreadcrumbs }

export const CommandMenu = {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Popup,
  Header,
  Footer,
  FocusZone,
  Input,
  List,
  Item,
  CheckboxItem,
  CheckboxItemIndicator,
  Group,
  GroupLabel,
  Empty,
  Loading,
  Separator,
  Shortcut,
  Icon,
  Subpage,
  SubpageTrigger,
  SubpageBack,
  SubpageBackItem,
  Surface,
  Kbd,
}
