'use client'

import * as React from 'react'
import type {
  ListboxStore,
  VirtualItem,
} from '../../listbox/store/ListboxStore.js'
import type {
  HighlightChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../events.js'

// ============================================================================
// Popup Menu Context
// ============================================================================
// Shared root-level context for popup menus (DropdownMenu, ContextMenu).
// Provides core menu functionality to all child components.

/**
 * Virtual anchor for positioning the menu at a specific point.
 * Used by ContextMenu to position at cursor location.
 */
export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect
}

/**
 * Virtualization configuration passed from Root/Submenu to Surface.
 */
export interface VirtualizationConfig {
  /** Whether virtualization mode is enabled */
  virtualized: boolean
  /** Pre-registered items for virtualization */
  items: VirtualItem[]
  /**
   * Callback when highlighted item changes (for scroll sync).
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange?: (
    id: string | null,
    index: number,
    eventDetails: HighlightChangeEventDetails,
  ) => void
}

/**
 * Shared context value for popup menus.
 * Both DropdownMenu.Root and ContextMenu.Root provide this context.
 */
export interface PopupMenuContextValue {
  /** The Listbox store instance */
  store: ListboxStore
  /** Whether this menu tree currently ignores user interaction. */
  disabled: boolean
  /** Nesting depth: 0 = root menu, 1+ = submenu */
  depth: number
  /** Close the entire menu tree (deepest submenu to root, sequentially) */
  closeAll: (reason?: PopupMenuOpenChangeReason, event?: Event) => void
  /**
   * Internal: when true, Surface handles Tab explicitly (close the tree, or
   * cycle through focus zones). Enabled only by DropdownMenu.Root and
   * ContextMenu.Root — never Select or Combobox.
   */
  explicitTabBehavior: boolean
  /**
   * Internal: what Tab does under `explicitTabBehavior` when the surface (and
   * its ancestors) have no focus-zone tabbables. `'close'` closes the whole
   * tree (dropdown/context-menu). `'inert'` swallows the event, keeping focus
   * where it is (command palette).
   */
  tabWithoutZones: 'close' | 'inert'
  /** Register a surface (submenu) for closeAll tracking. Returns unregister function. */
  registerSurface: (
    depth: number,
    setOpen: (open: boolean) => void,
  ) => () => void
  /** Virtualization configuration (if enabled) */
  virtualization?: VirtualizationConfig
  /**
   * Virtual anchor for positioning.
   * Used by ContextMenu to position at cursor location.
   * DropdownMenu uses the Popover's anchor (trigger button) instead.
   */
  virtualAnchor?: VirtualAnchor
  /**
   * Type of menu for positioning logic.
   * - 'dropdown': positions relative to trigger button
   * - 'context': positions at cursor with fixed positioning
   */
  menuType: 'dropdown' | 'context'
  /**
   * When to close the menu on outside interactions.
   * - 'pointerdown': Close immediately when pointer is pressed outside (default)
   * - 'click': Close when a full click (pointerdown + pointerup) occurs outside
   * @default 'pointerdown'
   */
  closeOnOutsidePress: 'click' | 'pointerdown'
}

const PopupMenuContext = React.createContext<PopupMenuContextValue | null>(null)

/**
 * Hook to access the popup menu context.
 * Throws if used outside a popup menu.
 */
export function usePopupMenuContext(): PopupMenuContextValue {
  const context = React.useContext(PopupMenuContext)
  if (!context) {
    throw new Error(
      'PopupMenu components must be used within a PopupMenu.Root or ContextMenu.Root',
    )
  }
  return context
}

/**
 * Hook to optionally access the popup menu context.
 * Returns null if used outside a popup menu.
 */
export function useMaybePopupMenuContext(): PopupMenuContextValue | null {
  return React.useContext(PopupMenuContext)
}

// Re-export for convenience
export type { VirtualItem }
export { PopupMenuContext }
