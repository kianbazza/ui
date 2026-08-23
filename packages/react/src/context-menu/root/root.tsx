'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  type PopupMenuDebugOptions,
  type PopupMenuHighlightChangeHandler,
  PopupMenuProviders,
  type PopupMenuRootActions,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
  type VirtualAnchor,
} from '../../internal/popup-menu/index.js'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
} from '../../internal/popup-menu/menu-tree/types.js'
import type {
  ContextMenuHighlightChangeEventDetails,
  ContextMenuOpenChangeEventDetails,
} from '../events.js'

export interface ContextMenuRootProps {
  /**
   * Whether the context menu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ContextMenuOpenChangeEventDetails,
  ) => void

  /**
   * Whether the context menu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether virtualization mode is enabled.
   * When true, items should provide an explicit `index` prop and
   * the `items` prop should be provided for navigation to work correctly.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   * When provided with `virtualized={true}`, this allows navigation to work
   * for items that aren't currently mounted in the DOM.
   */
  items?: VirtualItem[]

  /**
   * Callback when the highlighted item changes.
   * Useful for synchronizing with a virtualizer (e.g., scrollToIndex) or other UI state.
   * `id` is first. `node` is the resolved menu node carrying the highlighted ID, looked up in the menu's data-first tree — `null` when the highlight clears or when no data-first node carries that ID (e.g. JSX-defined rows). A JSX row that shares an ID with a data-first node yields that node; Resolved IDs are expected to be unique per menu.
   * The fourth parameter contains event details including the reason for the change.
   */
  onHighlightChange?: PopupMenuHighlightChangeHandler<ContextMenuHighlightChangeEventDetails>

  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean

  /**
   * Determines if the context menu enters a modal state when open.
   *
   * - `true`: user interaction is limited to the menu: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   *
   * @default true
   */
  modal?: boolean

  /**
   * When to close the menu on outside interactions.
   * - `'pointerdown'`: Close immediately when pointer is pressed outside (default)
   * - `'click'`: Close when a full click (pointerdown + pointerup) occurs outside
   * @default 'pointerdown'
   */
  closeOnOutsidePress?: 'click' | 'pointerdown'

  /**
   * Event handler called after any open/close animations have completed.
   * When `clearSearchOnClose="after-exit"` is set on Surface, the search
   * will be cleared before this callback is invoked.
   */
  onOpenChangeComplete?: (open: boolean) => void

  /**
   * A ref to imperative actions.
   * - `close`: closes the menu imperatively.
   * - `unmount`: unmounts the popup imperatively (when keep-mounted mode is enabled).
   * - `setDisabled`: enables/disables the menu imperatively.
   */
  actionsRef?: React.RefObject<ContextMenuRoot.Actions | null>

  /**
   * - Otherwise, use the row's full definition path (`definitionPath`) — identical in
   *   browse and deep-search contexts
   */

  /**
   * Computes canonical Resolved IDs for data-first content from the Unresolved Menu Node (definitional facts only).
   * @default encoded surface Definition Path joined with `/`; `idScope="menu"` uses the Definition Key
   * Read once when the menu root mounts — later changes have no effect. To retain the old dot-path default, use `node => node.def.id ?? node.definitionPath.join('.')`. This does not recreate former tree-item ancestry; exact compatibility requires walking `node.parent` and reproducing the old slug/key lineage.
   * @example
   * <ContextMenu.Root getResolvedId={(node) => node.def.id ?? node.definitionPath.join('.')} />
   */
  getResolvedId?: GetResolvedIdFn
  /** Definition Key uniqueness scope. Read once when the menu root mounts. @default 'surface' */
  idScope?: PopupMenuIdScope

  /**
   * Debug visualization options for submenu interaction heuristics.
   */
  debug?: PopupMenuDebugOptions

  children: React.ReactNode
}

/**
 * Internal context for ContextMenu-specific state.
 * Used by Trigger to set the virtual anchor position.
 */
interface ContextMenuInternalContextValue {
  /** Set the virtual anchor position (called by Trigger on right-click) */
  setAnchorPosition: (x: number, y: number, isTouchEvent?: boolean) => void
  /** Open the menu */
  openMenu: () => void
  /** Close the menu */
  closeMenu: () => void
  /** Whether the menu is disabled */
  disabled: boolean
  /** Whether the menu is open */
  open: boolean
}

const ContextMenuInternalContext =
  React.createContext<ContextMenuInternalContextValue | null>(null)

export function useContextMenuInternal(): ContextMenuInternalContextValue {
  const context = React.useContext(ContextMenuInternalContext)
  if (!context) {
    throw new Error(
      'ContextMenu components must be used within a ContextMenu.Root',
    )
  }
  return context
}

/**
 * Creates a virtual anchor at a specific point for positioning.
 */
function createVirtualAnchor(
  x: number,
  y: number,
  isTouchEvent = false,
): VirtualAnchor {
  // Touch events use a larger anchor for better UX
  const size = isTouchEvent ? 10 : 0
  return {
    getBoundingClientRect() {
      return DOMRect.fromRect({
        width: size,
        height: size,
        x,
        y,
      })
    },
  }
}

/**
 * Groups all parts of the context menu.
 * Manages open state and provides context to children.
 * Doesn't render its own HTML element.
 */
export function ContextMenuRoot(props: ContextMenuRoot.Props) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    disabled: disabledProp = false,
    modal = true,
    closeOnOutsidePress = 'pointerdown',
    onOpenChangeComplete: onOpenChangeCompleteProp,
    actionsRef,
    getResolvedId,
    idScope = 'surface',
    debug,
    children,
  } = props

  // Use shared hook to create stores and utilities
  const {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
    disabled: menuDisabled,
    setDisabled,
    menuTreeResolver,
  } = usePopupMenuRoot({
    // Cast to generic type - component handles type safety via narrowed types
    onOpenChange:
      onOpenChange as unknown as UsePopupMenuRootParams['onOpenChange'],
    defaultOpen,
    virtualized,
    items: itemsProp,
    onHighlightChange:
      onHighlightChange as unknown as UsePopupMenuRootParams['onHighlightChange'],
    closeOnOutsidePress,
    disabled: disabledProp,
    getResolvedId,
    idScope,
  })

  const popoverActionsRef = React.useRef<Popover.Root.Actions | null>(null)

  React.useImperativeHandle(
    actionsRef,
    () => ({
      close: () => {
        popoverActionsRef.current?.close()
      },
      unmount: () => {
        popoverActionsRef.current?.unmount()
      },
      setDisabled,
    }),
    [setDisabled],
  )

  // Sync controlled open prop to store
  store.useControlledProp('openProp', openProp)

  // Get open state from store
  const open = store.useState('open')

  // Virtual anchor state (position where menu appears)
  const [virtualAnchor, setVirtualAnchor] = React.useState<VirtualAnchor>(() =>
    createVirtualAnchor(0, 0),
  )

  // Set anchor position (called by Trigger on right-click/long-press)
  const setAnchorPosition = React.useCallback(
    (x: number, y: number, isTouchEvent = false) => {
      setVirtualAnchor(createVirtualAnchor(x, y, isTouchEvent))
    },
    [],
  )

  // Open the menu
  const openMenu = React.useCallback(() => {
    if (menuDisabled) return
    store.setOpen(true)
  }, [store, menuDisabled])

  // Close the menu
  const closeMenu = React.useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  // Handle animation complete - clear search and hide input if clearSearchOnClose is 'after-exit'
  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      // Clear search and hide input after exit animation completes
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }
      // Reset row width measurements after close animation completes
      if (!nextOpen) {
        store.clearHighlight()
        store.context.onCloseComplete?.()
        store.context.onPopupCloseComplete?.()
      }
      // Call user's callback
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  // Wrapper to adapt Popover's event details to our handleOpenChange
  const handlePopoverOpenChange = React.useCallback(
    (nextOpen: boolean, popoverDetails: Popover.Root.ChangeEventDetails) => {
      // Forward to our internal handler with the reason and event
      handleOpenChange(
        nextOpen,
        popoverDetails.reason as ContextMenuOpenChangeEventDetails['reason'],
        popoverDetails.event,
      )
    },
    [handleOpenChange],
  )

  // Internal context for Trigger
  const internalContextValue: ContextMenuInternalContextValue = React.useMemo(
    () => ({
      setAnchorPosition,
      openMenu,
      closeMenu,
      disabled: menuDisabled,
      open,
    }),
    [setAnchorPosition, openMenu, closeMenu, menuDisabled, open],
  )

  return (
    <ContextMenuInternalContext.Provider value={internalContextValue}>
      <PopupMenuProviders
        menuTreeResolver={menuTreeResolver}
        store={store}
        focusOwnerStore={focusOwnerStore}
        openChainStore={openChainStore}
        disabled={menuDisabled}
        depth={0}
        closeAll={closeAll}
        explicitTabBehavior
        registerSurface={registerSurface}
        virtualization={virtualization}
        virtualAnchor={virtualAnchor}
        menuType="context"
        closeOnOutsidePress={closeOnOutsidePress}
        componentName="context-menu"
        debug={debug}
      >
        <Popover.Root
          open={open}
          onOpenChange={handlePopoverOpenChange}
          onOpenChangeComplete={handleOpenChangeComplete}
          modal={modal}
          actionsRef={actionsRef ? popoverActionsRef : undefined}
        >
          {children}
        </Popover.Root>
      </PopupMenuProviders>
    </ContextMenuInternalContext.Provider>
  )
}

export namespace ContextMenuRoot {
  export interface Props extends ContextMenuRootProps {}
  export type OpenChangeEventDetails = ContextMenuOpenChangeEventDetails
  export type HighlightChangeEventDetails =
    ContextMenuHighlightChangeEventDetails
  export type Actions = PopupMenuRootActions
}
