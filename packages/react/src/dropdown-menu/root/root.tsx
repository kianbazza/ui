'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useCallback, useImperativeHandle, useRef } from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  type PopupMenuDebugOptions,
  type PopupMenuHighlightChangeHandler,
  PopupMenuProviders,
  type PopupMenuRootActions,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
} from '../../internal/popup-menu/menu-tree/types.js'
import type {
  DropdownMenuHighlightChangeEventDetails,
  DropdownMenuOpenChangeEventDetails,
} from '../events.js'

export interface DropdownMenuRootProps
  extends Omit<
    PopoverRootProps,
    'open' | 'onOpenChange' | 'defaultOpen' | 'actionsRef'
  > {
  /**
   * Whether the dropdown menu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: DropdownMenuOpenChangeEventDetails,
  ) => void

  /**
   * Whether the dropdown menu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Determines if the dropdown menu enters a modal state when open.
   *
   * - `true`: user interaction is limited to the dropdown menu: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the dropdown menu, but document page
   *   scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * @default true
   */
  modal?: boolean | 'trap-focus'

  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean

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
  onHighlightChange?: PopupMenuHighlightChangeHandler<DropdownMenuHighlightChangeEventDetails>

  /**
   * When to close the menu on outside interactions (clicking outside or clicking the trigger when open).
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
  actionsRef?: React.RefObject<DropdownMenuRoot.Actions | null>

  /**
   * Computes canonical Resolved IDs for data-first content from the Unresolved Menu Node (definitional facts only).
   * @default encoded surface Definition Path joined with `/`; `idScope="menu"` uses the Definition Key
   * Read once when the menu root mounts — later changes have no effect. To retain the old dot-path default, use `node => node.def.id ?? node.definitionPath.join('.')`. This does not recreate former tree-item ancestry; exact compatibility requires walking `node.parent` and reproducing the old slug/key lineage.
   * @example
   * <DropdownMenu.Root getResolvedId={(node) => node.def.id ?? node.definitionPath.join('.')} />
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
 * Groups all parts of the dropdown menu.
 * Manages open state and provides context to children.
 * Doesn't render its own HTML element.
 */
export function DropdownMenuRoot(props: DropdownMenuRoot.Props) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    modal = true,
    disabled = false,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    closeOnOutsidePress = 'pointerdown',
    onOpenChangeComplete: onOpenChangeCompleteProp,
    actionsRef,
    getResolvedId,
    idScope = 'surface',
    debug,
    children,
    ...rest
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
    disabled,
    getResolvedId,
    idScope,
  })

  const popoverActionsRef = useRef<Popover.Root.Actions | null>(null)

  useImperativeHandle(
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

  // Get open state from store for Popover
  const open = store.useState('open')

  // Handle animation complete - clear search and hide input if clearSearchOnClose is 'after-exit'
  const handleOpenChangeComplete = useCallback(
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
  const handlePopoverOpenChange = useCallback(
    (nextOpen: boolean, popoverDetails: Popover.Root.ChangeEventDetails) => {
      // Forward to our internal handler with the reason and event
      handleOpenChange(
        nextOpen,
        popoverDetails.reason as DropdownMenuOpenChangeEventDetails['reason'],
        popoverDetails.event,
      )
    },
    [handleOpenChange],
  )

  return (
    <PopupMenuProviders
      store={store}
      menuTreeResolver={menuTreeResolver}
      focusOwnerStore={focusOwnerStore}
      openChainStore={openChainStore}
      disabled={menuDisabled}
      depth={0}
      closeAll={closeAll}
      explicitTabBehavior
      registerSurface={registerSurface}
      virtualization={virtualization}
      menuType="dropdown"
      closeOnOutsidePress={closeOnOutsidePress}
      debug={debug}
      componentName="dropdown-menu"
    >
      <Popover.Root
        {...rest}
        open={open}
        onOpenChange={handlePopoverOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        modal={modal}
        actionsRef={actionsRef ? popoverActionsRef : undefined}
      >
        {children}
      </Popover.Root>
    </PopupMenuProviders>
  )
}

export namespace DropdownMenuRoot {
  export interface Props extends DropdownMenuRootProps {}
  export type OpenChangeEventDetails = DropdownMenuOpenChangeEventDetails
  export type HighlightChangeEventDetails =
    DropdownMenuHighlightChangeEventDetails
  export type Actions = PopupMenuRootActions
}
