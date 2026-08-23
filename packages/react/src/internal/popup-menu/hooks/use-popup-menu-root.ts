'use client'

import * as React from 'react'
import type { ChangeEventDetails } from '../../../utils/events/index.js'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../utils/events/index.js'
import { ensureInputModalityTracking } from '../../../utils/input-modality.js'
import { ListboxStore, type VirtualItem } from '../../listbox/index.js'
import type { VirtualizationConfig } from '../contexts/popup-menu-context.js'
import type {
  HighlightChangeEventDetails,
  PopupMenuHighlightChangeHandler,
  PopupMenuOpenChangeReason,
} from '../events.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import { createMenuTreeResolver } from '../menu-tree/resolver.js'
import type { GetResolvedIdFn } from '../menu-tree/types.js'
import { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface UsePopupMenuRootParams {
  /**
   * Computes canonical Resolved IDs for data-first content from the Unresolved Menu Node (definitional facts only).
   * @default explicit `def.id` verbatim, else the joined definition path
   * Read once when the menu root mounts — later changes have no effect.
   */
  getResolvedId?: GetResolvedIdFn
  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ChangeEventDetails<string>,
  ) => void

  /**
   * Whether the menu is initially open.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether virtualization mode is enabled.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   */
  items?: VirtualItem[]

  /**
   * Callback when the highlighted item changes. `id` is first; `node` is the
   * resolved menu node enrichment and may be null.
   * The fourth parameter contains event details including the reason for the change.
   */
  onHighlightChange?: PopupMenuHighlightChangeHandler<HighlightChangeEventDetails>

  /**
   * When to close the menu on outside interactions.
   * - 'pointerdown': Close immediately when pointer is pressed outside (default)
   * - 'click': Close when a full click (pointerdown + pointerup) occurs outside
   * @default 'pointerdown'
   */
  closeOnOutsidePress?: 'click' | 'pointerdown'

  /**
   * Whether the menu should ignore user interaction.
   * Can be controlled declaratively via this prop, or imperatively via actionsRef.setDisabled().
   * @default false
   */
  disabled?: boolean

  /**
   * Initial disabled state for imperative usage.
   * Ignored when `disabled` prop is true.
   * @default false
   */
  defaultDisabled?: boolean
}

export interface PopupMenuRootActions {
  /** Close the menu tree imperatively. */
  close: () => void
  /** Unmount the popup imperatively (when keep-mounted mode is enabled). */
  unmount: () => void
  /** Enable/disable the menu tree imperatively. */
  setDisabled: (disabled: boolean) => void
}

export interface UsePopupMenuRootReturn {
  /** The menu-tree resolver for this menu root. */
  menuTreeResolver: MenuTreeResolver
  /** The Listbox store instance */
  store: ListboxStore
  /** The FocusOwner store instance */
  focusOwnerStore: FocusOwnerStore
  /** The OpenChain store instance */
  openChainStore: OpenChainStore
  /** Register a surface (submenu) for closeAll tracking */
  registerSurface: (
    depth: number,
    setOpen: (open: boolean) => void,
  ) => () => void
  /** Close the entire menu tree */
  closeAll: (reason?: PopupMenuOpenChangeReason, event?: Event) => void
  /** Virtualization configuration (if enabled) */
  virtualization: VirtualizationConfig | undefined
  /** Handle open state change (updates store and clears stores on close) */
  handleOpenChange: (
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
  ) => void
  /** Whether the menu currently ignores user interaction. */
  disabled: boolean
  /** Update imperative disabled state. */
  setDisabled: (disabled: boolean) => void
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that creates and manages the core stores and utilities for popup menus.
 * Used by both DropdownMenu.Root and ContextMenu.Root.
 *
 * Provides:
 * - ListboxStore for item management
 * - FocusOwnerStore for focus tracking across submenus
 * - OpenChainStore for tracking open submenu chain
 * - Surface registry for closeAll functionality
 */
export function usePopupMenuRoot(
  params: UsePopupMenuRootParams = {},
): UsePopupMenuRootReturn {
  const {
    onOpenChange,
    defaultOpen = false,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    closeOnOutsidePress = 'pointerdown',
    disabled: disabledProp = false,
    defaultDisabled = false,
    getResolvedId,
  } = params

  const menuTreeResolverRef = React.useRef<MenuTreeResolver | null>(null)
  if (menuTreeResolverRef.current === null) {
    menuTreeResolverRef.current = createMenuTreeResolver(
      getResolvedId ? { getResolvedId } : undefined,
    )
  }
  const menuTreeResolver = menuTreeResolverRef.current

  const handleHighlightChange = React.useCallback(
    (
      id: string | null,
      index: number,
      eventDetails: HighlightChangeEventDetails,
    ) => {
      onHighlightChange?.(
        id,
        id === null ? null : (menuTreeResolver.getNodeById(id) ?? null),
        index,
        eventDetails,
      )
    },
    [menuTreeResolver, onHighlightChange],
  )

  const [imperativeDisabled, setImperativeDisabled] =
    React.useState(defaultDisabled)
  const disabled = disabledProp || imperativeDisabled

  const setDisabled = React.useCallback((nextDisabled: boolean) => {
    setImperativeDisabled(nextDisabled)
  }, [])

  // Begin tracking global input modality so the store can attribute opens to
  // mouse/touch/pen/keyboard. Idempotent; installed once for the whole app.
  React.useEffect(() => {
    ensureInputModalityTracking()
  }, [])

  // Track outside pointer events to distinguish outside-press from focus-out
  // When a pointerdown happens outside the menu, we store it so that if a
  // focus-out close happens immediately after, we can treat it as outside-press
  const outsidePointerEventRef = React.useRef<PointerEvent | null>(null)

  // Create stable callback wrapper for onOpenChange that converts focus-out to outside-press
  // when the close was triggered by a pointer event outside the menu
  const stableOnOpenChange = React.useCallback(
    (open: boolean, eventDetails: ChangeEventDetails<string>) => {
      // If closing due to focus-out but we have a stored outside pointer event,
      // convert the reason to outside-press for better cancel() support
      if (
        !open &&
        eventDetails.reason === REASONS.focusOut &&
        outsidePointerEventRef.current
      ) {
        const pointerEvent = outsidePointerEventRef.current
        outsidePointerEventRef.current = null

        // Create new event details with outside-press reason and the pointer event
        const convertedDetails = createChangeEventDetails(
          REASONS.outsidePress,
          pointerEvent,
        )

        onOpenChange?.(open, convertedDetails)

        // If the converted callback canceled, also cancel the original
        if (convertedDetails.isCanceled) {
          eventDetails.cancel()
        }
        return
      }

      // Clear the pointer event ref if we're not using it
      outsidePointerEventRef.current = null

      onOpenChange?.(open, eventDetails)
    },
    [onOpenChange],
  )

  // Create the store instance
  const store = ListboxStore.useStore(
    undefined,
    { open: defaultOpen },
    {
      onOpenChange: stableOnOpenChange,
    },
  )

  // Get current open state for the pointer event listener
  const isOpen = store.useState('open')

  // Create focus owner store (single instance for entire menu tree)
  const focusOwnerStoreRef = React.useRef<FocusOwnerStore | null>(null)
  if (!focusOwnerStoreRef.current) {
    focusOwnerStoreRef.current = new FocusOwnerStore()
  }
  const focusOwnerStore = focusOwnerStoreRef.current

  // Create open chain store (single instance for entire menu tree)
  const openChainStoreRef = React.useRef<OpenChainStore | null>(null)
  if (!openChainStoreRef.current) {
    openChainStoreRef.current = new OpenChainStore()
  }
  const openChainStore = openChainStoreRef.current

  // Registry for tracking open submenus (for closeAll)
  type SurfaceEntry = { depth: number; setOpen: (open: boolean) => void }
  const surfaceRegistryRef = React.useRef<Map<string, SurfaceEntry>>(new Map())

  // Register a surface (submenu) for closeAll tracking
  const registerSurface = React.useCallback(
    (depth: number, setOpen: (open: boolean) => void) => {
      const id = Math.random().toString(36).slice(2)
      surfaceRegistryRef.current.set(id, { depth, setOpen })
      return () => {
        surfaceRegistryRef.current.delete(id)
      }
    },
    [],
  )

  // Close the entire menu tree from deepest submenu to root
  const closeAll = React.useCallback(
    (reason: PopupMenuOpenChangeReason = REASONS.itemPress, event?: Event) => {
      // Sort surfaces by depth (deepest first)
      const surfaces = [...surfaceRegistryRef.current.values()].sort(
        (a, b) => b.depth - a.depth,
      )

      // Close each submenu from deepest to shallowest
      for (const surface of surfaces) {
        surface.setOpen(false)
      }

      // Finally close the root
      store.setOpen(false, reason, event)

      // Clear focus ownership and open chain
      focusOwnerStore.clearOwner()
      openChainStore.clear()
    },
    [store, focusOwnerStore, openChainStore],
  )

  // Ref to hold closeAll for use in the pointerdown effect
  const closeAllRef = React.useRef(closeAll)
  closeAllRef.current = closeAll

  // Listen for pointerdown events on document to detect outside clicks
  // This is a single listener at the root level that handles the entire menu tree.
  // Behavior depends on closeOnOutsidePress:
  // - 'pointerdown': Close immediately when pointer is pressed outside
  // - 'click': Store event and convert focus-out to outside-press reason
  React.useEffect(() => {
    if (!isOpen || disabled) {
      outsidePointerEventRef.current = null
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target) return

      // Check if the pointerdown is inside any part of the menu tree or its triggers
      // base-ui sets data-open on popups and data-popup-open on triggers
      const isInsidePopup = target.closest('[data-open]') !== null
      const isInsideTrigger = target.closest('[data-popup-open]') !== null
      const isInside = isInsidePopup || isInsideTrigger

      if (closeOnOutsidePress === 'pointerdown' && !isInside) {
        // Close entire menu tree immediately on pointerdown outside
        closeAllRef.current(REASONS.outsidePress, event)
      } else {
        // Store the event for focus-out-to-outside-press conversion
        outsidePointerEventRef.current = event
      }
    }

    // Use capture phase to see the event before any stopPropagation
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      outsidePointerEventRef.current = null
    }
  }, [isOpen, closeOnOutsidePress, disabled])

  // Handle open state change
  const handleOpenChange = React.useCallback(
    (
      newOpen: boolean,
      reason: PopupMenuOpenChangeReason = REASONS.none,
      event?: Event,
    ) => {
      const isImperativeAction = reason === REASONS.imperativeAction

      // Ignore user-driven open/close interactions while disabled.
      if (disabled && !isImperativeAction) {
        return
      }

      store.setOpen(newOpen, reason, event)
      // Clear focus ownership and open chain when menu closes
      if (!newOpen) {
        focusOwnerStore.clearOwner()
        openChainStore.clear()
      }
    },
    [store, focusOwnerStore, openChainStore, disabled],
  )

  // Memoize listbox wiring config
  const virtualization = React.useMemo(() => {
    if (!virtualized && !onHighlightChange) {
      return undefined
    }

    return {
      virtualized,
      items: itemsProp ?? [],
      onHighlightChange: handleHighlightChange,
    }
  }, [virtualized, itemsProp, handleHighlightChange, onHighlightChange])

  return {
    menuTreeResolver,
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
    disabled,
    setDisabled,
  }
}
