import { createSelector, ReactStore } from '@base-ui/utils/store'
import { useRefWithInit } from '@base-ui/utils/useRefWithInit'
import {
  createChangeEventDetails,
  createGenericEventDetails,
  REASONS,
} from '../../../utils/events/index.js'
import {
  deriveOpenMethod,
  type OpenMethod,
} from '../../../utils/input-modality.js'
import type {
  HighlightChangeEventDetails,
  HighlightChangeReason,
  PopupMenuOpenChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../../popup-menu/events.js'
import { commandScore } from '../utils/command-score.js'
import { normalizeValue } from '../utils/normalize.js'

export type { OpenMethod }

// ============================================================================
// Types
// ============================================================================

export type FilterFn = (
  value: string,
  search: string,
  keywords?: string[],
) => number

export type SearchNormalizer = (search: string) => string

export interface ItemRegistration {
  value: string
  keywords?: string[]
  groupId?: string
  disabled?: boolean
  /** Lower values are sorted earlier in score-based lists. */
  forceOrder?: number
  /** Overrides computed fuzzy score in score-based lists. */
  forceScore?: number
  /** Whether this item is a submenu trigger */
  isSubmenuTrigger?: boolean
  /** Single character keyboard shortcut to trigger this item */
  shortcut?: string
  /** Whether selecting this item should close the menu (default: true) */
  closeOnClick?: boolean
  /** Whether this item can be activated via Enter/click (default: true). Non-activatable items remain highlightable. */
  activatable?: boolean
}

/** Kinds of rows that participate in positional attributes. */
export type ListboxRowKind =
  | 'item'
  | 'group'
  | 'separator'
  | 'empty'
  | 'loading'

/** A mounted row tracked for positional attributes, in DOM order. */
export interface ListboxOrderedRow {
  /** Unique row id (stable per component instance). */
  id: string
  kind: ListboxRowKind
  /** Set for option-like rows rendered inside a Group/RadioGroup. */
  groupId?: string
}

/**
 * Pre-registered item for virtualization.
 * This allows the store to know about all items even when they're not mounted.
 * The `value` field serves as both the unique identifier and the filtering value.
 */
export interface VirtualItem {
  /** Value used as unique identifier and for filtering/matching */
  value: string
  /** Additional keywords for filtering */
  keywords?: string[]
  /** Whether the item is disabled */
  disabled?: boolean
}

export type HighlightSource = 'keyboard' | 'pointer' | 'auto' | null

/**
 * Describes why the consumer updated ordered items when filter={false}.
 * - `replace`: list was re-ordered/replaced (default)
 * - `append`: new items were appended to the end while preserving existing order
 */
export type OrderedItemsUpdateReason = 'replace' | 'append'

export interface SetOrderedItemsOptions {
  /** Why ordered items were updated. @default 'replace' */
  reason?: OrderedItemsUpdateReason
}

/**
 * Refs for DOM elements used for scroll behavior.
 * These are stored outside of reactive state to avoid unnecessary re-renders.
 */
export interface DOMRefs {
  /** Ref to the semantic listbox element */
  listRef: React.RefObject<HTMLElement | null>
  /** Ref to the element that owns the list's scroll position */
  listScrollContainerRef: React.RefObject<HTMLElement | null>
  /** Ref to the popup (visual container) element */
  popupRef: React.RefObject<HTMLElement | null>
  /** Map of item ID to ref for the item's DOM element */
  itemRefs: Map<string, React.RefObject<HTMLElement | null>>
  /** Map of group ID to ref for the group's DOM element */
  groupRefs: Map<string, React.RefObject<HTMLElement | null>>
}

export interface ListboxState {
  /** Whether the listbox is open internally when uncontrolled */
  open: boolean
  /** Controlled open prop. When defined, selectors resolve this over `open`. */
  openProp: boolean | undefined

  /**
   * How the listbox was most recently opened (`mouse`/`touch`/`pen`/`keyboard`).
   * `null` until first opened. Retained after close (only updated on open).
   */
  openMethod: OpenMethod | null

  /** Current internal search query when uncontrolled */
  search: string
  /** Controlled search prop. When defined, selectors resolve this over `search`. */
  searchProp: string | undefined

  /** Normalized search query used for filtering and visibility checks */
  normalizedSearch: string
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** Source of the current highlight (keyboard or pointer) */
  highlightSource: HighlightSource
  /** Whether an Input is present in the Surface */
  hasInput: boolean
  /** Whether the input is currently active (rendered) when hideUntilActive mode is used */
  inputActive: boolean
  /** Pending search character typed before input was active */
  pendingSearch: string
  /** Filtered results: item ID to score */
  filteredItems: Map<string, number>
  /** Groups that have at least one visible item */
  visibleGroups: Set<string>
  /** Count of visible items */
  filteredCount: number
  /** Counter to trigger re-filtering when items change */
  filterTrigger: number
  /** Whether virtualization mode is enabled */
  virtualized: boolean
  /** Count of virtual items (from items prop) */
  virtualItemsCount: number
  /**
   * Rows currently mounted in the DOM, sorted by document position.
   * Mounted ⇔ visible, so this is the list of visible rows.
   * Immutable: replaced wholesale on every registry change so selectors recompute.
   */
  orderedRows: readonly ListboxOrderedRow[]
}

export interface ListboxContext {
  /** Filter function or false to disable filtering */
  filter: FilterFn | false
  /** Function used to normalize search before filtering. */
  normalizeSearch: SearchNormalizer
  /** Whether to loop navigation */
  loop: boolean
  /**
   * Controls auto-highlighting behavior when the menu opens.
   * - `true`: highlight the first item (default)
   * - `false`: don't auto-highlight any item
   * - `string`: highlight the item with this specific value
   */
  autoHighlightFirst: boolean | string
  /**
   * Whether to clear search on close.
   * - `true`: clear immediately when menu closes (default)
   * - `false`: preserve search when menu closes
   * - `'after-exit'`: clear after exit animation completes (requires Surface to call clearSearch)
   */
  clearSearchOnClose: boolean | 'after-exit'
  /** Whether to reset list scroll position when search changes. */
  resetScrollOnSearch: boolean
  /** Whether hideUntilActive mode is enabled */
  hideUntilActive: boolean
  /** ID for the list element (for aria-activedescendant) */
  listId: string
  /** ID for the input element */
  inputId: string
  /** Map of item ID to registration data */
  readonly items: Map<string, ItemRegistration>
  /** Map of group ID to set of item IDs */
  readonly groups: Map<string, Set<string>>
  /** Map of item ID to onSelect callback */
  readonly itemSelects: Map<string, () => void>
  /** Map of submenu trigger ID to open callback */
  readonly submenuOpens: Map<string, () => void>
  /** Map of submenu trigger ID to close callback */
  readonly submenuCloses: Map<string, () => void>
  /** Map of shortcut key to item ID */
  readonly shortcuts: Map<string, string>
  /** Map of row ID to its mounted DOM element (positional registry). */
  readonly rowElements: Map<string, HTMLElement>
  /**
   * Callback when open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange: (
    open: boolean,
    eventDetails: PopupMenuOpenChangeEventDetails,
  ) => void
  /** Callback when search state changes */
  onSearchChange: ((search: string) => void) | undefined
  /**
   * Pre-registered items for virtualization.
   * When provided, navigation uses this array order instead of DOM registration order.
   */
  virtualItems: VirtualItem[]
  /**
   * Consumer-provided ordered list of item values when filter={false}.
   * Used to determine correct navigation/highlight order when consumer handles filtering externally.
   * Must always be provided when filter={false}.
   */
  orderedItems: string[]
  /**
   * Callback when highlighted item changes.
   * Useful for synchronizing with virtualizers (scrollToIndex) and other UI state.
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange:
    | ((
        id: string | null,
        index: number,
        eventDetails: HighlightChangeEventDetails,
      ) => void)
    | undefined
  /**
   * DOM refs for scroll behavior.
   * Stored in context (not state) to avoid re-renders.
   */
  refs: DOMRefs
  /**
   * Callback when menu close animation completes.
   * Used for resetting row width measurements.
   */
  onCloseComplete?: () => void
  /**
   * Callback when popup close transition completes.
   * Used by popup-layer features that should reset only after exit animations.
   */
  onPopupCloseComplete?: () => void
  /**
   * Last known pointer position for detecting actual pointer movement.
   * Used to prevent "phantom" highlights when content shifts under a stationary pointer.
   */
  lastPointerPosition: { x: number; y: number } | null
}

/**
 * Options for the validateHighlight method.
 */
interface ValidateHighlightOptions {
  /**
   * Force highlighting the first item, even if current highlight is valid.
   * Used when the list order changes (e.g., after filtering).
   */
  forceFirst?: boolean
  /**
   * The newly computed filteredItems map. If not provided, uses state.filteredItems.
   * This is needed when calling from recomputeFilteredItems before state is updated.
   */
  filteredItems?: Map<string, number>
  /**
   * The new search query that corresponds to filteredItems.
   * Used together with prevSearch to detect when search is cleared.
   */
  newSearch?: string
  /**
   * The previous search query before the change.
   * Used together with newSearch to detect when search is cleared.
   */
  prevSearch?: string
}

// ============================================================================
// Selectors
// ============================================================================

const selectors = {
  open: createSelector((state: ListboxState) => state.openProp ?? state.open),
  openMethod: createSelector((state: ListboxState) => state.openMethod),
  search: createSelector(
    (state: ListboxState) => state.searchProp ?? state.search,
  ),
  normalizedSearch: createSelector(
    (state: ListboxState) => state.normalizedSearch,
  ),
  highlightedId: createSelector((state: ListboxState) => state.highlightedId),
  highlightSource: createSelector(
    (state: ListboxState) => state.highlightSource,
  ),
  hasInput: createSelector((state: ListboxState) => state.hasInput),
  inputActive: createSelector((state: ListboxState) => state.inputActive),
  pendingSearch: createSelector((state: ListboxState) => state.pendingSearch),
  filteredCount: createSelector((state: ListboxState) => state.filteredCount),
  filteredItems: createSelector((state: ListboxState) => state.filteredItems),
  visibleGroups: createSelector((state: ListboxState) => state.visibleGroups),
  virtualized: createSelector((state: ListboxState) => state.virtualized),

  isHighlighted: createSelector(
    (state: ListboxState, itemId: string) => state.highlightedId === itemId,
  ),

  isGroupVisible: createSelector(
    (state: ListboxState, groupId: string) =>
      state.normalizedSearch.length === 0 || state.visibleGroups.has(groupId),
  ),

  isFirstRow: createSelector((state: ListboxState, rowId: string) => {
    if (state.virtualized) return false
    const rows = state.orderedRows.filter((r) => r.groupId === undefined)
    return rows[0]?.id === rowId
  }),

  isLastRow: createSelector((state: ListboxState, rowId: string) => {
    if (state.virtualized) return false
    const rows = state.orderedRows.filter((r) => r.groupId === undefined)
    return rows.at(-1)?.id === rowId
  }),

  isFirstGroup: createSelector((state: ListboxState, rowId: string) => {
    if (state.virtualized) return false
    const groups = state.orderedRows.filter((r) => r.kind === 'group')
    return groups[0]?.id === rowId
  }),

  isLastGroup: createSelector((state: ListboxState, rowId: string) => {
    if (state.virtualized) return false
    const groups = state.orderedRows.filter((r) => r.kind === 'group')
    return groups.at(-1)?.id === rowId
  }),

  isFirstInGroup: createSelector((state: ListboxState, rowId: string) => {
    if (state.virtualized) return false
    const row = state.orderedRows.find((r) => r.id === rowId)
    if (!row?.groupId) return false
    const siblings = state.orderedRows.filter((r) => r.groupId === row.groupId)
    return siblings[0]?.id === rowId
  }),

  isLastInGroup: createSelector((state: ListboxState, rowId: string) => {
    if (state.virtualized) return false
    const row = state.orderedRows.find((r) => r.id === rowId)
    if (!row?.groupId) return false
    const siblings = state.orderedRows.filter((r) => r.groupId === row.groupId)
    return siblings.at(-1)?.id === rowId
  }),

  getItemScore: createSelector((state: ListboxState, itemId: string) => {
    if (state.normalizedSearch.length === 0) {
      return 1 // All items visible when no search
    }
    return state.filteredItems.get(itemId) ?? 0
  }),

  hasSearchWithNoResults: createSelector((state: ListboxState) => {
    // Must have an active search
    if (state.normalizedSearch.length === 0) return false

    // In virtualized mode with items prop, check virtualItemsCount
    // (filteredCount won't be accurate since items aren't registered in DOM)
    if (state.virtualized && state.virtualItemsCount >= 0) {
      return state.virtualItemsCount === 0
    }

    // Non-virtualized mode: check filteredCount from registered items
    return state.filteredCount === 0
  }),
}

interface DomOrderEntry {
  id: string
  element: HTMLElement | null
  index: number
}

/**
 * Orders items by DOM position, falling back to relative registration order
 * when either element is unmounted/disconnected (a deterministic fallback —
 * returning 0 would make the comparator inconsistent when null and connected
 * elements are mixed, leaving placement implementation-defined).
 */
function compareByDomOrder(a: DomOrderEntry, b: DomOrderEntry): number {
  if (
    a.element === null ||
    b.element === null ||
    !a.element.isConnected ||
    !b.element.isConnected
  ) {
    return a.index - b.index
  }

  return a.element.compareDocumentPosition(b.element) &
    Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1
}

const defaultSearchNormalizer: SearchNormalizer = (search) => {
  return normalizeValue(search)
}

// ============================================================================
// Store
// ============================================================================

/**
 * Core store for listbox-like components.
 * Handles item registration, filtering, navigation, and highlight state.
 *
 * Used by: DropdownMenu, ContextMenu, Select, CommandMenu
 */
export class ListboxStore extends ReactStore<
  ListboxState,
  ListboxContext,
  typeof selectors
> {
  constructor(
    initialState?: Partial<ListboxState>,
    context?: Partial<ListboxContext>,
  ) {
    const defaultContext: ListboxContext = {
      filter: commandScore,
      normalizeSearch: defaultSearchNormalizer,
      loop: true,
      autoHighlightFirst: true,
      clearSearchOnClose: true,
      resetScrollOnSearch: true,
      hideUntilActive: false,
      listId: '',
      inputId: '',
      items: new Map(),
      groups: new Map(),
      itemSelects: new Map(),
      submenuOpens: new Map(),
      submenuCloses: new Map(),
      shortcuts: new Map(),
      rowElements: new Map(),
      onOpenChange: () => {},
      onSearchChange: undefined,
      virtualItems: [],
      orderedItems: [],
      onHighlightChange: undefined,
      refs: {
        listRef: { current: null },
        listScrollContainerRef: { current: null },
        popupRef: { current: null },
        itemRefs: new Map(),
        groupRefs: new Map(),
      },
      onCloseComplete: undefined,
      onPopupCloseComplete: undefined,
      lastPointerPosition: null,
    }

    const mergedContext = { ...defaultContext, ...context }
    const mergedState = { ...createInitialState(), ...initialState }
    mergedState.normalizedSearch = mergedContext.normalizeSearch(
      mergedState.search,
    )

    super(mergedState, mergedContext, selectors)

    // Handle open/close
    this.observe('open', (open, prevOpen) => {
      if (open === prevOpen) {
        return
      }

      if (open) {
        // Reset pointer position tracking on open to prevent phantom highlights
        this.resetPointerPosition()

        // Auto-highlight is now handled by applyAutoHighlight() called from Surface
        // after it has set the context. This ensures the correct value is used.
        // We only handle the simple boolean true case here for backwards compatibility
        // with components that don't use Surface (if any).
        const autoHighlight = this.context.autoHighlightFirst
        if (autoHighlight === true) {
          // Default: highlight first item
          this.highlightFirstItem()
        }
        // String values are handled by applyAutoHighlight() from Surface
      } else {
        // Clear search and highlight on close
        // When 'after-exit', search is cleared by Root after animation completes
        if (this.context.clearSearchOnClose === true) {
          this.setSearch('')
        }

        // When 'after-exit', also defer hiding the input until animation completes
        // This prevents the input from disappearing before the popup animates out
        const deferInputHide = this.context.clearSearchOnClose === 'after-exit'

        this.update({
          inputActive: deferInputHide ? this.state.inputActive : false,
          pendingSearch: '',
        })
      }
    })

    // Keep normalizedSearch in sync when search changes (including controlled props).
    this.observe('search', (search, prevSearch) => {
      if (search !== prevSearch) {
        this.syncNormalizedSearch()
      }
    })

    this.observe(
      (state: ListboxState) => state.searchProp,
      (searchProp, prevSearchProp) => {
        if (searchProp !== prevSearchProp) {
          this.syncNormalizedSearch()
        }
      },
    )

    // Recompute filtered items when normalized search changes.
    this.observe('normalizedSearch', (search, prevSearch) => {
      if (search !== prevSearch) {
        // Reset pointer position when search changes - content is about to shift
        // and we don't want stationary pointers to trigger phantom highlights
        this.resetPointerPosition()
        this.recomputeFilteredItems(prevSearch)

        if (this.context.resetScrollOnSearch && !this.state.virtualized) {
          this.scrollListToTop()
        }
      }
    })
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set the open state with event details.
   *
   * @param open - The new open state
   * @param reason - The reason for the state change (default: 'none')
   * @param event - The native DOM event that triggered the change (optional)
   */
  setOpen(
    open: boolean,
    reason: PopupMenuOpenChangeReason = REASONS.none,
    event?: Event,
  ) {
    const eventDetails = createChangeEventDetails(reason, event)

    // Call the user's callback first
    this.context.onOpenChange(open, eventDetails)

    // If the user canceled, don't update internal state
    if (eventDetails.isCanceled) {
      return
    }

    // Record how the popup was opened so hover-only affordances (scroll arrows,
    // Select's align-item-with-trigger) can disable themselves for touch input.
    // Set before `open` so observers of `open` see the current method.
    if (open) {
      this.set('openMethod', deriveOpenMethod(event))
    }

    this.set('open', open)
  }

  setSearch(search: string) {
    const effectiveSearch = this.state.searchProp ?? search
    this.update({
      search,
      normalizedSearch: this.context.normalizeSearch(effectiveSearch),
    })
    this.context.onSearchChange?.(search)
    // Note: recomputeFilteredItems is called by the 'normalizedSearch' observer
  }

  setSearchNormalizer(normalizeSearch: SearchNormalizer) {
    this.context.normalizeSearch = normalizeSearch

    const effectiveSearch = this.state.searchProp ?? this.state.search
    const normalizedSearch = normalizeSearch(effectiveSearch)
    if (normalizedSearch !== this.state.normalizedSearch) {
      this.set('normalizedSearch', normalizedSearch)
    }
  }

  private syncNormalizedSearch() {
    const search = this.state.searchProp ?? this.state.search
    const normalizedSearch = this.context.normalizeSearch(search)
    if (normalizedSearch !== this.state.normalizedSearch) {
      this.set('normalizedSearch', normalizedSearch)
    }
  }

  private defaultSearchInitialized = false

  initializeDefaultSearch(defaultSearch: string) {
    if (this.defaultSearchInitialized) return
    this.defaultSearchInitialized = true

    if (
      this.state.searchProp === undefined &&
      defaultSearch !== this.state.search
    ) {
      this.setSearch(defaultSearch)
    }
  }

  setHighlightedId(id: string | null, cause: HighlightSource = 'pointer') {
    const prevId = this.state.highlightedId
    if (prevId === id) return

    // Close any open submenus that are not the newly highlighted item
    // This ensures only one submenu is open at a time in this menu
    this.closeSiblingSubmenus(id)

    this.update({ highlightedId: id, highlightSource: cause })

    // Always notify about highlight changes (for virtualization, analytics, etc.)
    this.notifyHighlightChange(id, cause)

    // Handle scroll behavior for keyboard navigation
    if (cause === 'keyboard' && id !== null) {
      this.scrollItemIntoView(id)
    }
  }

  /**
   * Notify listeners about highlight changes.
   * Called whenever highlightedId changes, regardless of virtualization or DOM state.
   * Useful for virtualization scroll sync, analytics, or any other tracking needs.
   *
   * @param id - The newly highlighted item ID (or null if cleared)
   * @param cause - What caused the highlight change
   */
  private notifyHighlightChange(id: string | null, cause: HighlightSource) {
    const { onHighlightChange } = this.context
    if (!onHighlightChange) return

    // Map cause to reason
    const reason: HighlightChangeReason =
      cause === 'keyboard'
        ? REASONS.keyboard
        : cause === 'pointer'
          ? REASONS.pointer
          : REASONS.auto

    // Get the index of the highlighted item
    const index =
      id === null
        ? -1
        : this.state.virtualized
          ? this.getVirtualItemIndex(id)
          : this.getVisibleItemIndex(id)

    const eventDetails = createGenericEventDetails(reason, undefined, { index })
    onHighlightChange(id, index, eventDetails)
  }

  /**
   * Scroll the highlighted item into view.
   * Uses native scrollIntoView if the element is in the DOM.
   * For virtualized lists, the onHighlightChange callback (called from setHighlightedId)
   * should handle scrolling via the virtualizer.
   *
   * @param id - The item ID to scroll into view
   */
  private scrollItemIntoView(id: string) {
    const { refs } = this.context
    const listEl = refs.listRef.current
    const itemRef = refs.itemRefs.get(id)
    const itemEl = itemRef?.current

    // If the item element exists and is inside the list, use native scrollIntoView
    if (itemEl && listEl) {
      try {
        const isInList = listEl.contains(itemEl)
        if (isInList) {
          itemEl.scrollIntoView({ block: 'nearest' })
          this.maybeRevealGroupTop(id, listEl)
        }
      } catch {
        // Ignore errors from scrollIntoView
      }
    }
    // For virtualized lists where the item is not in the DOM,
    // the onHighlightChange callback handles scroll via virtualizer
  }

  /**
   * Reveal the top of an item's group after the item has been scrolled into
   * view. When keyboard navigation lands on the first visible item of a
   * group, aligning the viewport to the item alone leaves the group's label
   * clipped just above the viewport (e.g. when navigating upward or wrapping
   * around). Scrolling up by the clipped amount aligns the viewport top with
   * the group's top edge so the label is visible.
   *
   * No-ops when the item is not the first visible item of its group, when the
   * group element is unknown or outside the list, or when the group's top is
   * already visible (e.g. when navigating downward).
   */
  private maybeRevealGroupTop(id: string, listEl: HTMLElement) {
    const groupId = this.context.items.get(id)?.groupId
    if (!groupId) return

    // Only the group's first visible item anchors to the group top
    const visibleIds = this.getVisibleItemIds()
    const firstInGroup = visibleIds.find(
      (visibleId) => this.context.items.get(visibleId)?.groupId === groupId,
    )
    if (firstInGroup !== id) return

    const groupEl = this.context.refs.groupRefs.get(groupId)?.current
    if (!groupEl || !listEl.contains(groupEl)) return

    const scrollEl =
      this.context.refs.listScrollContainerRef.current ??
      this.getScrollResetElement(listEl)

    const clippedAbove =
      scrollEl.getBoundingClientRect().top - groupEl.getBoundingClientRect().top
    if (clippedAbove > 0) {
      scrollEl.scrollTop -= clippedAbove
    }
  }

  private scrollListToTop() {
    const listEl = this.context.refs.listRef.current
    const scrollEl =
      this.context.refs.listScrollContainerRef.current ??
      (listEl ? this.getScrollResetElement(listEl) : null)
    if (!scrollEl) return

    if (typeof scrollEl.scrollTo === 'function') {
      scrollEl.scrollTo({ top: 0 })
      return
    }

    // jsdom and older DOM environments may not implement Element.scrollTo.
    // Assigning scrollTop keeps the behavior testable and preserves the reset.
    scrollEl.scrollTop = 0
  }

  private getScrollResetElement(listEl: HTMLElement): HTMLElement {
    let element: HTMLElement | null = listEl

    while (element) {
      if (this.isScrollableElement(element)) {
        return element
      }

      element = element.parentElement
    }

    return listEl
  }

  private isScrollableElement(element: HTMLElement): boolean {
    const win = element.ownerDocument?.defaultView
    const overflowY = win?.getComputedStyle(element).overflowY
    const canScrollY =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'

    return (
      element.scrollTop > 0 ||
      (canScrollY && element.scrollHeight > element.clientHeight)
    )
  }

  setHasInput(hasInput: boolean) {
    this.set('hasInput', hasInput)
  }

  setInputActive(active: boolean) {
    this.set('inputActive', active)
  }

  setPendingSearch(search: string) {
    this.set('pendingSearch', search)
  }

  setHideUntilActive(enabled: boolean) {
    this.context.hideUntilActive = enabled
    // If enabling and there's already search content, activate immediately
    if (enabled && this.state.normalizedSearch.length > 0) {
      this.setInputActive(true)
    }
  }

  setVirtualized(virtualized: boolean) {
    this.set('virtualized', virtualized)
  }

  setVirtualItems(items: VirtualItem[]) {
    const prevItems = this.context.virtualItems
    this.context.virtualItems = items

    // Update count in state for selectors to use
    this.set('virtualItemsCount', items.length)

    // Pre-register all virtual items so filtering works for unmounted items
    this.preRegisterVirtualItems()

    // Skip if items reference didn't change (same array)
    if (items === prevItems) {
      return
    }

    // Skip if the navigation-relevant data hasn't changed.
    // Virtual items are often recreated (new array reference) when parent content
    // re-renders due to non-navigation changes (e.g. checkbox checked state).
    // Only trigger highlight validation when values or disabled states actually differ.
    if (prevItems.length === items.length) {
      let same = true
      for (let i = 0; i < prevItems.length; i++) {
        const prev = prevItems[i]
        const next = items[i]
        if (
          !prev ||
          !next ||
          prev.value !== next.value ||
          prev.disabled !== next.disabled
        ) {
          same = false
          break
        }
      }
      if (same) {
        return
      }
    }

    // Skip highlight validation if not in the right state
    if (!this.state.virtualized || !this.state.open || items.length === 0) {
      return
    }

    // Determine if we need to force highlight the first item
    const prevFirstItem = prevItems.find((item) => !item.disabled)
    const newFirstItem = items.find((item) => !item.disabled)
    // Only force "first item" behavior when there was a previous first item.
    // This avoids transient resets caused by virtualization effect cleanup
    // temporarily clearing virtual items between renders.
    const firstItemChanged =
      prevFirstItem !== undefined && newFirstItem?.value !== prevFirstItem.value

    // Validate and potentially update the highlight
    this.validateHighlight({ forceFirst: firstItemChanged })
  }

  /**
   * Set the consumer-provided ordered items.
   * Used when filter={false} and consumer controls item order/visibility.
   * Must always be provided when filter={false}.
   *
   * @param items - Array of item IDs in display order
   */
  setOrderedItems(items: string[], options?: SetOrderedItemsOptions) {
    const reason = options?.reason ?? 'replace'
    const prevItems = this.context.orderedItems
    this.context.orderedItems = items

    // Skip if items reference didn't change (same array)
    if (items === prevItems) {
      return
    }

    // Skip highlight update if not open
    if (!this.state.open) {
      return
    }

    // For append-only updates, preserve current highlight when it remains valid.
    if (reason === 'append' && this.state.highlightedId !== null) {
      const highlightedId = this.state.highlightedId
      const highlightedRegistration = this.context.items.get(highlightedId)
      const isStillInOrderedItems = items.includes(highlightedId)
      const isStillEnabled = highlightedRegistration
        ? !highlightedRegistration.disabled
        : false

      if (isStillInOrderedItems && isStillEnabled) {
        return
      }
    }

    // When ordered items change, highlight the first registered item
    // Use 'auto' source to indicate this is automatic (not user-initiated)
    // This prevents submenus from auto-opening
    if (items.length > 0) {
      const firstRegisteredItem = items.find((id) => this.context.items.has(id))
      if (firstRegisteredItem !== undefined) {
        this.setHighlightedId(firstRegisteredItem, 'auto')
      } else {
        this.setHighlightedId(null)
      }
    } else {
      this.setHighlightedId(null)
    }
  }

  /**
   * Try to auto-highlight when an item registers.
   * This handles the case where orderedItems was set before items mounted.
   * Only highlights if:
   * - filter={false} (using orderedItems)
   * - Menu is open
   * - No item is currently highlighted
   * - autoHighlightFirst is enabled
   * - The registering item is the first in orderedItems
   */
  private maybeAutoHighlightOnRegister(id: string) {
    if (this.context.filter !== false) {
      return
    }
    if (!this.state.open) {
      return
    }
    if (this.state.highlightedId !== null) {
      return
    }
    if (!this.context.autoHighlightFirst) {
      return
    }

    const orderedItems = this.context.orderedItems
    if (orderedItems.length === 0) {
      return
    }

    // Find the first item in orderedItems that is registered
    const firstRegisteredItem = orderedItems.find((itemId) =>
      this.context.items.has(itemId),
    )

    // Only highlight if this is the first registered item
    // Use 'auto' source to indicate this is automatic (not user-initiated)
    if (firstRegisteredItem === id) {
      this.setHighlightedId(id, 'auto')
    }
  }

  setOnHighlightChange(
    callback:
      | ((
          id: string | null,
          index: number,
          eventDetails: HighlightChangeEventDetails,
        ) => void)
      | undefined,
  ) {
    this.context.onHighlightChange = callback
  }

  // ============================================================================
  // DOM Refs Management
  // ============================================================================

  /**
   * Set the list element ref for scroll container detection.
   */
  setListRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.listRef = ref
  }

  /**
   * Set the list scroll container ref for scroll position management.
   * Use this when the semantic list element is rendered inside another
   * scrollable container, such as a custom ScrollArea viewport.
   */
  setListScrollContainerRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.listScrollContainerRef = ref
  }

  /**
   * Set the popup (visual container) ref. Used by popup-layer features such as
   * Select's align-item-with-trigger positioning.
   */
  setPopupRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.popupRef = ref
  }

  /**
   * Register an item's DOM ref for scrollIntoView behavior.
   * Returns a cleanup function.
   */
  registerItemRef(
    id: string,
    ref: React.RefObject<HTMLElement | null>,
  ): () => void {
    this.context.refs.itemRefs.set(id, ref)
    return () => {
      this.context.refs.itemRefs.delete(id)
    }
  }

  // ============================================================================
  // Pointer Position Tracking
  // ============================================================================

  /**
   * Check if pointer has moved and should allow highlight.
   * This prevents "phantom" highlights when content shifts under a stationary pointer
   * (e.g., when search results change or menu items reorder).
   *
   * @param x - Current pointer X position
   * @param y - Current pointer Y position
   * @returns true if pointer has actually moved and highlight should be allowed
   */
  shouldAllowPointerHighlight(x: number, y: number): boolean {
    const last = this.context.lastPointerPosition
    if (last === null) {
      // First pointer event - record position and allow highlight
      this.context.lastPointerPosition = { x, y }
      return true
    }

    // Check if pointer has actually moved (with small tolerance for sub-pixel movements)
    const dx = Math.abs(x - last.x)
    const dy = Math.abs(y - last.y)
    const hasMoved = dx > 1 || dy > 1

    if (hasMoved) {
      // Update position and allow highlight
      this.context.lastPointerPosition = { x, y }
      return true
    }

    // Pointer hasn't moved - don't allow highlight
    return false
  }

  /**
   * Reset pointer position tracking.
   * Call this when the menu opens or content changes significantly.
   */
  resetPointerPosition() {
    this.context.lastPointerPosition = null
  }

  /**
   * Pre-register virtual items so they appear in filteredItems.
   * This allows filtering to work for items that aren't mounted yet.
   */
  private preRegisterVirtualItems() {
    const virtualItems = this.context.virtualItems
    if (virtualItems.length === 0) return

    // Register each virtual item (using value as the unique identifier)
    for (const item of virtualItems) {
      if (!this.context.items.has(item.value)) {
        this.context.items.set(item.value, {
          value: item.value,
          keywords: item.keywords,
          disabled: item.disabled,
        })
      }
    }

    // Recompute filtered items to include virtual items
    this.recomputeFilteredItems()
  }

  // ============================================================================
  // Item Registration
  // ============================================================================

  registerItem(id: string, registration: ItemRegistration): () => void {
    // Check if this item is already registered with the same properties
    // This optimization reduces unnecessary recomputation in virtualized mode
    const existing = this.context.items.get(id)
    const isSameRegistration =
      existing &&
      existing.value === registration.value &&
      existing.disabled === registration.disabled &&
      existing.forceOrder === registration.forceOrder &&
      existing.forceScore === registration.forceScore &&
      existing.groupId === registration.groupId &&
      existing.shortcut === registration.shortcut &&
      existing.activatable === registration.activatable

    if (isSameRegistration) {
      // Item already registered with same properties, skip recompute
      return () => {
        // Only clean up if this item is still in the map
        // (another registration might have replaced it)
        if (this.context.items.get(id) === existing) {
          this.context.items.delete(id)
          this.context.itemSelects.delete(id)
          if (registration.groupId) {
            this.context.groups.get(registration.groupId)?.delete(id)
          }
          if (registration.shortcut) {
            this.context.shortcuts.delete(registration.shortcut.toLowerCase())
          }
          this.recomputeFilteredItems()
        }
      }
    }

    this.context.items.set(id, registration)

    // Add to group if specified
    if (registration.groupId) {
      const groupItems = this.context.groups.get(registration.groupId)
      if (groupItems) {
        groupItems.add(id)
      }
    }

    // Register shortcut if specified
    if (registration.shortcut) {
      const key = registration.shortcut.toLowerCase()
      this.context.shortcuts.set(key, id)
    }

    // Trigger recompute
    this.recomputeFilteredItems()

    // When filter={false} and we're open with no highlight, try to highlight
    // This handles the case where orderedItems was set before items mounted
    this.maybeAutoHighlightOnRegister(id)

    return () => {
      this.context.items.delete(id)
      this.context.itemSelects.delete(id)

      if (registration.groupId) {
        const groupItems = this.context.groups.get(registration.groupId)
        if (groupItems) {
          groupItems.delete(id)
        }
      }

      // Unregister shortcut
      if (registration.shortcut) {
        const key = registration.shortcut.toLowerCase()
        this.context.shortcuts.delete(key)
      }

      this.recomputeFilteredItems()
    }
  }

  /**
   * Register a group. Optionally registers the group's DOM element ref,
   * used for scroll positioning (e.g. revealing the group's label).
   * Returns a cleanup function.
   */
  registerGroup(
    id: string,
    ref?: React.RefObject<HTMLElement | null>,
  ): () => void {
    this.context.groups.set(id, new Set())
    if (ref) {
      this.context.refs.groupRefs.set(id, ref)
    }

    return () => {
      this.context.groups.delete(id)
      this.context.refs.groupRefs.delete(id)
    }
  }

  /**
   * Register a mounted row element for positional tracking.
   * Rows are kept in `state.orderedRows` sorted by DOM document position.
   * Call from a layout effect once the element is mounted; the returned
   * cleanup removes the row (call it when the element unmounts).
   */
  registerRow(
    id: string,
    element: HTMLElement,
    row: { kind: ListboxRowKind; groupId?: string },
  ): () => void {
    this.context.rowElements.set(id, element)

    const withoutRow = this.state.orderedRows.filter((r) => r.id !== id)
    const next = [...withoutRow, { id, kind: row.kind, groupId: row.groupId }]
    next.sort((a, b) => this.compareRowOrder(a, b))
    this.set('orderedRows', next)

    return () => {
      // Only remove if this registration still owns the id (a re-registration
      // for the same id may have replaced the element already).
      if (this.context.rowElements.get(id) === element) {
        this.context.rowElements.delete(id)
        this.set(
          'orderedRows',
          this.state.orderedRows.filter((r) => r.id !== id),
        )
      }
    }
  }

  /**
   * Compare two rows by DOM document position.
   * Falls back to preserving current relative order when either element
   * is missing or disconnected (Array.prototype.sort is stable).
   */
  private compareRowOrder(a: ListboxOrderedRow, b: ListboxOrderedRow): number {
    const elA = this.context.rowElements.get(a.id)
    const elB = this.context.rowElements.get(b.id)
    if (!elA || !elB || !elA.isConnected || !elB.isConnected) {
      return 0
    }
    const position = elA.compareDocumentPosition(elB)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1
    }
    if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1
    }
    return 0
  }

  registerItemSelect(
    id: string,
    onSelect: (() => void) | undefined,
  ): () => void {
    if (onSelect) {
      this.context.itemSelects.set(id, onSelect)
    }
    return () => {
      this.context.itemSelects.delete(id)
    }
  }

  registerSubmenuOpen(
    id: string,
    onOpen: (() => void) | undefined,
  ): () => void {
    if (onOpen) {
      this.context.submenuOpens.set(id, onOpen)
    }
    return () => {
      this.context.submenuOpens.delete(id)
    }
  }

  registerSubmenuClose(
    id: string,
    onClose: (() => void) | undefined,
  ): () => void {
    if (onClose) {
      this.context.submenuCloses.set(id, onClose)
    }
    return () => {
      this.context.submenuCloses.delete(id)
    }
  }

  /**
   * Close all submenus except the one with the given ID.
   * Used when hovering over a new submenu trigger to close sibling submenus.
   */
  closeSiblingSubmenus(exceptId: string | null) {
    for (const [id, onClose] of this.context.submenuCloses) {
      if (id !== exceptId) {
        try {
          onClose()
        } catch {
          // Ignore errors from closing submenus
        }
      }
    }
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  highlightNext() {
    const visibleIds = this.getVisibleItemIds()

    if (visibleIds.length === 0) return

    const currentIndex = this.state.highlightedId
      ? visibleIds.indexOf(this.state.highlightedId)
      : -1
    let nextIndex = currentIndex + 1

    if (nextIndex >= visibleIds.length) {
      nextIndex = this.context.loop ? 0 : visibleIds.length - 1
    }

    const nextId = visibleIds[nextIndex]

    if (nextId) {
      this.setHighlightedId(nextId, 'keyboard')
    }
  }

  highlightPrev() {
    const visibleIds = this.getVisibleItemIds()

    if (visibleIds.length === 0) return

    const currentIndex = this.state.highlightedId
      ? visibleIds.indexOf(this.state.highlightedId)
      : visibleIds.length
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      prevIndex = this.context.loop ? visibleIds.length - 1 : 0
    }

    const prevId = visibleIds[prevIndex]

    if (prevId) {
      this.setHighlightedId(prevId, 'keyboard')
    }
  }

  selectHighlighted() {
    if (this.state.highlightedId) {
      const item = this.context.items.get(this.state.highlightedId)
      if (item?.activatable === false) return

      const onSelect = this.context.itemSelects.get(this.state.highlightedId)
      onSelect?.()
    }
  }

  /**
   * Select an item by its keyboard shortcut.
   * Returns true if an item was found and selected, false otherwise.
   */
  selectByShortcut(key: string): boolean {
    const itemId = this.context.shortcuts.get(key.toLowerCase())
    if (!itemId) return false

    const registration = this.context.items.get(itemId)
    if (!registration || registration.disabled) return false

    // Check if item is visible (passes filter)
    const score = this.state.filteredItems.get(itemId) ?? 0
    const isVisible = this.state.normalizedSearch.length === 0 || score > 0
    if (!isVisible) return false

    const onSelect = this.context.itemSelects.get(itemId)
    onSelect?.()
    return true
  }

  openSubmenuForHighlighted() {
    if (this.state.highlightedId) {
      const onOpen = this.context.submenuOpens.get(this.state.highlightedId)
      onOpen?.()
    }
  }

  isHighlightedSubmenuTrigger(): boolean {
    if (!this.state.highlightedId) return false
    return (
      this.context.items.get(this.state.highlightedId)?.isSubmenuTrigger ??
      false
    )
  }

  /**
   * Get the item registration for the highlighted item.
   * Returns undefined if no item is highlighted.
   */
  getHighlightedItem(): ItemRegistration | undefined {
    if (!this.state.highlightedId) return undefined
    return this.context.items.get(this.state.highlightedId)
  }

  clearSearch() {
    this.setSearch('')
  }

  clearHighlight() {
    this.update({ highlightedId: null, highlightSource: null })
  }

  highlightFirstItem() {
    const visibleIds = this.getVisibleItemIds()
    if (visibleIds.length > 0 && visibleIds[0]) {
      // Don't set a cause - auto-highlight shouldn't trigger scroll
      this.update({ highlightedId: visibleIds[0], highlightSource: null })
    } else {
      this.update({ highlightedId: null, highlightSource: null })
    }
  }

  /**
   * Apply auto-highlight based on the current context.autoHighlightFirst value.
   * Called by Surface after updating the context to ensure correct value is used.
   */
  applyAutoHighlight() {
    if (!this.state.open) return

    const autoHighlight = this.context.autoHighlightFirst
    if (autoHighlight === true) {
      this.highlightFirstItem()
    } else if (typeof autoHighlight === 'string') {
      this.highlightItemByValue(autoHighlight)
    }
    // If false, don't highlight anything
  }

  /**
   * Highlight a specific item by its value.
   * If the item is not visible or doesn't exist, falls back to highlighting the first item.
   * Scrolls the highlighted item into view.
   */
  highlightItemByValue(value: string) {
    const visibleIds = this.getVisibleItemIds()
    let highlightedId: string | null = null

    if (visibleIds.includes(value)) {
      // Item exists and is visible - highlight it
      highlightedId = value
    } else if (visibleIds.length > 0 && visibleIds[0]) {
      // Fall back to first item if specified value not found
      highlightedId = visibleIds[0]
    }

    this.update({ highlightedId, highlightSource: null })

    // Scroll the highlighted item into view
    // This is important when opening a combobox with a pre-selected value
    // that may be far down the list
    if (highlightedId) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        this.scrollItemIntoView(highlightedId)
      })
    }
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  /**
   * Returns whether filtering is disabled (consumer handles filtering externally).
   */
  isFilterDisabled(): boolean {
    return this.context.filter === false
  }

  getVisibleItemIds(): string[] {
    const result: string[] = []
    const search = this.state.normalizedSearch
    const filteredItems = this.state.filteredItems
    const virtualItems = this.context.virtualItems
    const orderedItems = this.context.orderedItems

    // When virtualized with items, use the virtualItems order
    // This ensures navigation order matches the data array order
    if (this.state.virtualized && virtualItems.length > 0) {
      for (const item of virtualItems) {
        const score = filteredItems.get(item.value) ?? 0
        const isVisible = search.length === 0 || score > 0
        if (isVisible && !item.disabled) {
          result.push(item.value)
        }
      }
      return result
    }

    // When consumer provides ordered items (filter={false}), use that order
    // This ensures navigation matches the consumer's intended display order
    if (this.context.filter === false && orderedItems.length > 0) {
      // Track unregistered items for warning
      const unregisteredItems: string[] = []

      for (const itemId of orderedItems) {
        const registration = this.context.items.get(itemId)
        // Only include if registered (mounted) and not disabled
        if (registration && !registration.disabled) {
          result.push(itemId)
        } else if (!registration) {
          unregisteredItems.push(itemId)
        }
      }

      // Only warn about unregistered items if SOME items are registered
      // If no items are registered, we're likely in the initial mount phase
      // and items will register shortly via maybeAutoHighlightOnRegister
      if (
        process.env.NODE_ENV !== 'production' &&
        unregisteredItems.length > 0 &&
        result.length > 0
      ) {
        for (const itemId of unregisteredItems) {
          console.warn(
            `[ListboxStore] Item "${itemId}" is in orderedItems but not registered. ` +
              'This may cause keyboard navigation to skip this item. ' +
              'Make sure the render function passes the `id` prop: <Item {...props}>...</Item>',
          )
        }
      }

      return result
    }

    // Non-virtualized: sort mounted items by DOM order. Registration order
    // (Map insertion) drifts when a subset remounts (Fast Refresh effects,
    // Suspense retries, key changes), which made keyboard navigation jump.
    const visibleItems: DomOrderEntry[] = []

    let registrationIndex = 0
    this.context.items.forEach((registration, id) => {
      const index = registrationIndex++
      const score = filteredItems.get(id) ?? 0
      const isVisible = search.length === 0 || score > 0
      if (isVisible && !registration.disabled) {
        visibleItems.push({
          id,
          element: this.context.refs.itemRefs.get(id)?.current ?? null,
          index,
        })
      }
    })

    visibleItems.sort(compareByDomOrder)

    for (const { id } of visibleItems) {
      result.push(id)
    }

    return result
  }

  /**
   * Get the index of an item in the visible items list.
   * Returns -1 if the item is not found or not visible.
   */
  getVisibleItemIndex(id: string): number {
    return this.getVisibleItemIds().indexOf(id)
  }

  /**
   * Get the index of an item in the virtualItems array.
   * This is used for virtualizer scrollToIndex which needs the raw array index,
   * not the filtered/visible index.
   * Returns -1 if not found or not in virtualized mode.
   */
  getVirtualItemIndex(value: string): number {
    if (!this.state.virtualized) return -1
    return this.context.virtualItems.findIndex((item) => item.value === value)
  }

  /**
   * Validates and updates the highlighted item.
   * This is the single source of truth for highlight management.
   *
   * @param options.forceFirst - Force highlight first item even if current is valid
   * @param options.filteredItems - Use this map instead of state (for mid-update calls)
   * @param options.newSearch - The search query for filteredItems (to detect search cleared)
   */
  private validateHighlight(
    options: ValidateHighlightOptions = {},
  ): string | null {
    const {
      forceFirst = false,
      filteredItems = this.state.filteredItems,
      newSearch,
      prevSearch: optionsPrevSearch,
    } = options

    // Determine if search changed (requires reset to first item)
    // Use prevSearch from options if provided (from observer), otherwise fall back to state
    const prevSearch =
      optionsPrevSearch !== undefined
        ? optionsPrevSearch
        : this.state.normalizedSearch
    const effectiveSearch = newSearch !== undefined ? newSearch : prevSearch
    const searchChanged = newSearch !== undefined && newSearch !== prevSearch

    // If not open or autoHighlightFirst disabled, don't change anything
    if (!this.state.open || !this.context.autoHighlightFirst) {
      return this.state.highlightedId
    }

    const currentHighlight = this.state.highlightedId
    const { filter } = this.context

    // If search changed, force reset to first item
    const shouldForceFirst = forceFirst || searchChanged

    // Check if current highlight is valid
    let isCurrentValid = false
    if (currentHighlight && !shouldForceFirst) {
      // Check if item exists and passes filter
      const score = filteredItems.get(currentHighlight) ?? 0
      const isVisible =
        effectiveSearch.length === 0 || filter === false || score > 0

      // Check if item is disabled
      const registration = this.context.items.get(currentHighlight)
      const virtualItem = this.context.virtualItems.find(
        (v) => v.value === currentHighlight,
      )
      const isDisabled =
        registration?.disabled ?? virtualItem?.disabled ?? false

      // Item must be registered (in items map) for non-virtualized mode
      const isRegistered = this.state.virtualized || registration !== undefined

      // In virtualized mode, item must also be in virtualItems array
      const inVirtualItems =
        !this.state.virtualized ||
        this.context.virtualItems.length === 0 ||
        virtualItem !== undefined

      isCurrentValid =
        isVisible && !isDisabled && isRegistered && inVirtualItems
    }

    // If current highlight is valid and we're not forcing first, keep it
    if (isCurrentValid) {
      return currentHighlight
    }

    // Find the first valid item to highlight
    let newHighlightId: string | null = null

    if (this.state.virtualized && this.context.virtualItems.length > 0) {
      // Virtualized mode: use virtualItems order
      for (const item of this.context.virtualItems) {
        const score = filteredItems.get(item.value) ?? 0
        const isVisible =
          effectiveSearch.length === 0 || filter === false || score > 0
        if (isVisible && !item.disabled) {
          newHighlightId = item.value
          break
        }
      }
    } else if (filter === false && this.context.orderedItems.length > 0) {
      // Consumer-controlled filtering: use orderedItems order
      for (const itemId of this.context.orderedItems) {
        const registration = this.context.items.get(itemId)
        // Only include if registered (mounted) and not disabled
        if (registration && !registration.disabled) {
          newHighlightId = itemId
          break
        }
      }
    } else {
      // Non-virtualized mode: first valid item in DOM order — must agree with
      // getVisibleItemIds(), which also sorts by DOM order (registration order
      // drifts when a subset of items remounts).
      let first: DomOrderEntry | null = null
      let registrationIndex = 0
      for (const [id, registration] of this.context.items) {
        const index = registrationIndex++
        const score = filteredItems.get(id) ?? 0
        const isVisible = effectiveSearch.length === 0 || score > 0
        if (isVisible && !registration.disabled) {
          const candidate: DomOrderEntry = {
            id,
            element: this.context.refs.itemRefs.get(id)?.current ?? null,
            index,
          }
          if (first === null || compareByDomOrder(candidate, first) < 0) {
            first = candidate
          }
        }
      }
      newHighlightId = first?.id ?? null
    }

    // Only update if highlight actually changed
    if (newHighlightId !== currentHighlight) {
      this.update({
        highlightedId: newHighlightId,
        highlightSource: null, // Auto-highlight shouldn't trigger scroll
      })
    }

    return newHighlightId
  }

  private recomputeFilteredItems(prevSearch?: string) {
    const { filter } = this.context
    const normalizedSearch = this.state.normalizedSearch
    const items = this.context.items
    const groups = this.context.groups

    const filteredItems = new Map<string, number>()
    const visibleGroups = new Set<string>()
    let filteredCount = 0

    // If no search or filtering disabled, all items are visible
    if (!normalizedSearch || filter === false) {
      // When virtualized with consumer-side filtering (filter === false),
      // use virtualItems as the source of truth for what's visible.
      // This ensures the scores match the consumer's filtered array,
      // not just what's currently mounted.
      if (this.state.virtualized && this.context.virtualItems.length > 0) {
        for (const item of this.context.virtualItems) {
          filteredItems.set(item.value, 1)
          filteredCount++
        }
      } else {
        items.forEach((_, id) => {
          filteredItems.set(id, 1)
          filteredCount++
        })
      }
      groups.forEach((_, groupId) => {
        visibleGroups.add(groupId)
      })
    } else {
      // Apply filter function
      const filterFn = filter || commandScore
      items.forEach((registration, id) => {
        const fuzzyScore = filterFn(
          registration.value,
          normalizedSearch,
          registration.keywords,
        )
        const score = registration.forceScore ?? fuzzyScore
        filteredItems.set(id, score)
        if (score > 0) {
          filteredCount++
          if (registration.groupId) {
            visibleGroups.add(registration.groupId)
          }
        }
      })
    }

    // When filter={false}, consumer controls highlighting via setConsumerFilteredItems.
    // Don't call validateHighlight here because consumerFilteredItems hasn't been updated yet.
    // The highlight will be set when setConsumerFilteredItems is called from the Surface effect.
    if (filter === false) {
      this.update({
        filteredItems,
        visibleGroups,
        filteredCount,
        filterTrigger: this.state.filterTrigger + 1,
        // Don't change highlight - let setConsumerFilteredItems handle it
      })
      return
    }

    // Validate highlight using the newly computed filteredItems
    // We pass filteredItems, newSearch, and prevSearch here because we need to detect search cleared
    const highlightedId = this.validateHighlight({
      filteredItems,
      newSearch: normalizedSearch,
      prevSearch,
    })

    this.update({
      filteredItems,
      visibleGroups,
      filteredCount,
      filterTrigger: this.state.filterTrigger + 1,
      highlightedId,
      // Auto-highlight shouldn't trigger scroll
      highlightSource: null,
    })
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  static useStore(
    externalStore: ListboxStore | undefined,
    initialState?: Partial<ListboxState>,
    context?: Partial<ListboxContext>,
  ): ListboxStore {
    const store = useRefWithInit(() => {
      return externalStore ?? new ListboxStore(initialState, context)
    }).current

    return store
  }
}

// ============================================================================
// Initial State Factory
// ============================================================================

function createInitialState(): ListboxState {
  return {
    open: false,
    openProp: undefined,
    openMethod: null,
    search: '',
    searchProp: undefined,
    normalizedSearch: '',
    highlightedId: null,
    highlightSource: null,
    hasInput: false,
    inputActive: false,
    pendingSearch: '',
    filteredItems: new Map(),
    visibleGroups: new Set(),
    filteredCount: 0,
    filterTrigger: 0,
    virtualized: false,
    virtualItemsCount: 0,
    orderedRows: [],
  }
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { ListboxContext as Context, ListboxState as State }
