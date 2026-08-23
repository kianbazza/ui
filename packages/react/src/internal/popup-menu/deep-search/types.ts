import type * as React from 'react'
import type { PopupMenuCheckboxItemProps } from '../components/checkbox-item/checkbox-item.js'
import type { PopupMenuItemProps } from '../components/item/item.js'
import type { PopupMenuRadioGroupProps } from '../components/radio-group/radio-group.js'
import type { PopupMenuRadioItemProps } from '../components/radio-item/radio-item.js'
import type { PopupMenuSubmenuTriggerProps } from '../components/submenu-trigger/submenu-trigger.js'
import type { PopupMenuSubpageTriggerProps } from '../components/subpage-trigger/subpage-trigger.js'
import type { PopupMenuNode } from '../menu-tree/types.js'

// ============================================================================
// Async Loader Types
// ============================================================================

/**
 * Library-agnostic result from an async loader.
 * Compatible with TanStack Query, SWR, and custom loaders.
 */
export type AsyncLoaderSource = 'tanstack-query' | 'swr' | 'vanilla' | 'custom'

/**
 * Canonical async loader status.
 * - 'idle': no request has been executed yet
 * - 'pending': request in progress and no successful data yet
 * - 'success': last resolved state has data
 * - 'error': last resolved state errored
 */
export type AsyncLoaderStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Canonical fetch status.
 */
export type AsyncLoaderFetchStatus = 'idle' | 'fetching' | 'paused'

/**
 * Loading phase for distinguishing first-load from background revalidation.
 */
export type AsyncLoaderLoadingPhase = 'none' | 'initial' | 'background'

export interface AsyncLoaderResult<TData, TRaw = unknown> {
  /** The loaded data, undefined while loading or on error */
  data: TData | undefined

  /** Raw result object returned by the underlying data library */
  raw?: TRaw

  /** Source data library backing this result */
  source?: AsyncLoaderSource

  /** Error if the load failed, null otherwise */
  error: Error | null

  /** Canonical status state */
  status: AsyncLoaderStatus

  /** Canonical fetch state */
  fetchStatus: AsyncLoaderFetchStatus

  /** Distinguishes initial load vs background fetch */
  loadingPhase: AsyncLoaderLoadingPhase

  /** True during the initial loading phase (TanStack-aligned semantics) */
  isLoading: boolean

  /** Whether any fetch is currently in-flight */
  isFetching: boolean

  /** Alias of `isLoading` for explicit phase naming */
  isInitialLoading: boolean

  /** True when background re-fetch is in-flight */
  isRefetching: boolean

  /** Whether query state is pending */
  isPending: boolean

  /** Whether query state is successful */
  isSuccess: boolean

  /** Whether the loader encountered an error */
  isError: boolean

  /** Whether fetching is paused */
  isPaused: boolean

  /** Whether data is currently available */
  hasData: boolean

  /** Whether any fetch has completed at least once */
  hasFetched: boolean

  /** Optional function to refetch the data */
  refetch?: () => unknown
}

/**
 * Props passed to loader components.
 * The component should call hooks internally and pass the result to children.
 */
export interface LoaderComponentProps {
  /** Search query (for query loaders) */
  query: string
  /** Whether the loader should execute its fetch/query hook */
  enabled?: boolean
  /** Render function receiving loader state */
  children: (state: AsyncLoaderResult<NodeDef[]>) => React.ReactNode
}

/**
 * Controls query-loader behavior before users type an active query.
 */
export interface InitialQueryBehavior {
  /**
   * Query value used before user input reaches minQueryLength.
   * Defaults to '' (top/default results).
   * @default ''
   */
  value?: string
  /**
   * When the initial query should load.
   * - 'needed': when submenu is explicitly opened or needed for deep-search execution
   * - 'parent-open': eagerly when direct parent opens
   * @default 'needed'
   */
  loadWhen?: 'needed' | 'parent-open'
}

/**
 * Static loader configuration.
 * Loads data once, then filters client-side.
 */
export interface StaticLoaderConfig {
  type: 'static'
  /**
   * Component that calls hooks and provides loader state.
   * This component pattern allows hooks to be called legally within React's rules.
   */
  Loader: React.ComponentType<LoaderComponentProps>
  /**
   * When to trigger the loader:
   * - 'eager': Load when menu opens (good for deep search)
   * - 'lazy': Load when submenu opens (default)
   * @default 'lazy'
   */
  loadStrategy?: 'eager' | 'lazy'
}

/**
 * Query loader configuration.
 * Refetches based on search query - server does the filtering.
 */
export interface QueryLoaderConfig {
  type: 'query'
  /**
   * Component that calls hooks and provides loader state.
   * Receives the current search query as a prop.
   */
  Loader: React.ComponentType<LoaderComponentProps>
  /**
   * Minimum query length before fetching.
   * @default 1
   */
  minQueryLength?: number
  /**
   * Defines behavior before user query reaches minQueryLength.
   * - object: executes query loader with the configured initial value (default behavior)
   * - false: disables initial fetch until query reaches minQueryLength
   * @default { value: '', loadWhen: 'needed' }
   */
  initialQueryBehavior?: InitialQueryBehavior | false
  /**
   * @deprecated Use `initialQueryBehavior` instead.
   */
  initialQuery?: string
  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens (good for deep search)
   * - 'lazy': Load when submenu opens (default)
   * @default 'lazy'
   */
  loadStrategy?: 'eager' | 'lazy'
  /**
   * What to show when query is below minQueryLength.
   * - 'empty': Show nothing
   * - 'placeholder': Show placeholderNodes
   * @default 'empty'
   */
  belowMinBehavior?: 'empty' | 'placeholder'
  /**
   * Placeholder nodes shown when query is below minQueryLength.
   */
  placeholderNodes?: NodeDef[]
}

/**
 * Controls how submenu content participates in ancestor deep search results.
 * - `true`: include submenu trigger and descendants
 * - `'trigger-only'`: include submenu trigger only
 * - `false`: exclude submenu trigger and descendants
 */
export type IncludeInDeepSearch = true | 'trigger-only' | false

/**
 * Union of all async loader configurations.
 */
export type AsyncLoaderConfig = StaticLoaderConfig | QueryLoaderConfig

/**
 * Static async nodes configuration for submenus.
 */
export type StaticAsyncNodesConfig = StaticLoaderConfig

/**
 * Query async nodes configuration for submenus.
 */
export type QueryAsyncNodesConfig = QueryLoaderConfig

/**
 * Async nodes configuration for submenus.
 * Union of static and query loader configs.
 */
export type AsyncNodesConfig = StaticAsyncNodesConfig | QueryAsyncNodesConfig

/**
 * Async state exposed to submenu render functions.
 */
export interface AsyncRenderState {
  /** Canonical status state */
  status: AsyncLoaderStatus
  /** Canonical fetch state */
  fetchStatus: AsyncLoaderFetchStatus
  /** Distinguishes initial load vs background fetch */
  loadingPhase: AsyncLoaderLoadingPhase
  /** True during the initial loading phase */
  isLoading: boolean
  /** Whether any fetch is currently in-flight */
  isFetching: boolean
  /** Alias of `isLoading` for explicit phase naming */
  isInitialLoading: boolean
  /** True when background re-fetch is in-flight */
  isRefetching: boolean
  /** Whether the loader encountered an error */
  isError: boolean
  /** The error if any */
  error: Error | null
  /** For query loaders: whether query is below minQueryLength */
  isBelowMinLength?: boolean
}

/**
 * Aggregate async state exposed to DataList children.
 */
export interface AsyncState {
  /** Any loader is currently in initial loading phase */
  isLoading: boolean

  /** Any loader is currently fetching */
  isFetching: boolean

  /** Any loader is in first-load phase */
  isInitialLoading: boolean

  /** Any loader is in background refetch phase */
  isRefetching: boolean

  /** All registered loaders are in background refetch phase */
  isAllRefetching: boolean

  /** Static loaders specifically are loading */
  isStaticLoading: boolean

  /** Static loaders in first-load phase */
  isStaticInitialLoading: boolean

  /** Static loaders in background refetch phase */
  isStaticRefetching: boolean

  /** Query loaders specifically are loading */
  isQueryLoading: boolean

  /** Query loaders in first-load phase */
  isQueryInitialLoading: boolean

  /** Query loaders in background refetch phase */
  isQueryRefetching: boolean

  /** Menus that failed (skipped from results) */
  skippedMenus: Array<{ id: string; reason: 'error' }>
}

// ============================================================================
/**
 * Branch node info passed in breadcrumbs context.
 * Contains the full submenu/subpage definition for maximum flexibility.
 */
export interface BreadcrumbNode {
  /** The branch node definition */
  node: SubmenuDef | SubpageDef | TreeItemDef
  /** The branch node's value */
  value: string
  /** The branch node's explicit id (if provided) */
  id?: string
}

// ============================================================================
// Render Context - passed to all render functions
// ============================================================================

/**
 * Context passed to item, submenu, and subpage render functions.
 * Provides information about the current rendering context (search, breadcrumbs, state).
 */
export interface RowRenderContext {
  /**
   * Search context - the query in the menu where this row is being rendered.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Match score for this row (higher = better match). */
    score: number
  } | null

  /**
   * Full path of branch nodes from root to this row's parent.
   * Contains the full submenu/subpage node definitions for maximum flexibility.
   * Empty array [] for items directly in root menu.
   */
  breadcrumbs: BreadcrumbNode[]

  /**
   * True if this row is being rendered outside its "home" menu
   * (surfaced via deep search from an ancestor menu).
   */
  isDeepSearchResult: boolean

  /** Whether this row is currently highlighted/focused */
  highlighted: boolean

  /** Whether this row is disabled */
  disabled: boolean

  /**
   * The group this item belongs to, if any.
   * `null` if the item is not inside a group.
   */
  group: { id: string; label?: string } | null

  /** Tree rendering context, or null for non-tree and search rows. */
  tree: {
    depth: number
    hasChildren: boolean
    isLastChild: boolean
    ancestorsLast: boolean[]
    header: boolean
  } | null
}

// ============================================================================
// Item Render Params
// ============================================================================

/**
 * Props to spread onto the Item component.
 * Derived from PopupMenuItemProps.
 */
export type ItemRenderProps = {
  /**
   * Canonical Resolved ID for the item, generated by the root policy: the
   * encoded surface Definition Path by default, or the Definition Key in
   * menu scope.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   * Use this for display, search matching, or any logic that needs the raw value.
   */
  value: string
} & Required<Pick<PopupMenuItemProps, 'disabled'>> &
  Pick<
    PopupMenuItemProps,
    'closeOnClick' | 'onSelect' | 'shortcut' | 'forceOrder' | 'forceScore'
  >

/**
 * Parameters passed to item render functions.
 */
export interface ItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the Item component */
  props: ItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (ItemDef.value) */
    value: string
    disabled: boolean
  }
}

/** Props to spread onto a TreeItem component. */
export type TreeItemRenderProps = Omit<ItemRenderProps, 'shortcut'> & {
  /** Whether this row can be selected. */
  selectable: boolean
}

/** Parameters passed to tree item render functions. */
export interface TreeItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  props: TreeItemRenderProps
  context: RowRenderContext & {
    value: string
    disabled: boolean
  }
}

// ============================================================================
// Radio Item Render Params
// ============================================================================

/**
 * Props to spread onto the RadioItem component.
 * Derived from PopupMenuRadioItemProps.
 */
export type RadioItemRenderProps = {
  /**
   * Qualified unique ID for the radio item.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
} & Required<Pick<PopupMenuRadioItemProps, 'value' | 'disabled'>> &
  Pick<
    PopupMenuRadioItemProps,
    'closeOnClick' | 'onSelect' | 'shortcut' | 'forceOrder' | 'forceScore'
  >

/**
 * Parameters passed to radio item render functions.
 */
export interface RadioItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the RadioItem component */
  props: RadioItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (RadioItemDef.value) */
    value: string
    disabled: boolean
  }
}

// ============================================================================
// Submenu Render Params
// ============================================================================

/**
 * Props to spread onto the SubmenuTrigger component.
 * Derived from PopupMenuSubmenuTriggerProps.
 */
export type SubmenuRenderProps = {
  /**
   * Qualified unique ID for the submenu trigger.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   */
  value: string
} & Required<Pick<PopupMenuSubmenuTriggerProps, 'disabled'>> &
  Pick<PopupMenuSubmenuTriggerProps, 'forceOrder' | 'forceScore'>

/**
 * Parameters passed to submenu render functions.
 * Includes context plus the submenu's child nodes and render function.
 */
export interface SubmenuRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the SubmenuTrigger */
  props: SubmenuRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (SubmenuDef.value) */
    value: string
    disabled: boolean
    /** Async loading state (if asyncNodes configured) */
    async?: AsyncRenderState
  }
  /**
   * The submenu's static child node definitions.
   * Does NOT include async results - use `asyncContent` for that.
   */
  nodes: NodeDef[]
  /**
   * Async content configuration for this submenu.
   * Pass this to the submenu's DataSurface to enable async loading
   * with the submenu's own search query (independent of parent search).
   */
  asyncContent?: AsyncNodesConfig
  /**
   * Function to render a child node.
   * Call this for each node in the submenu's list.
   */
  /** Resolved nodes are unwrapped to their defs. */
  renderNode: (node: NodeDef | PopupMenuNode) => React.ReactNode
}

// ============================================================================
// Subpage Render Types
// ============================================================================

/**
 * Props to spread onto the SubpageTrigger component.
 * Derived from PopupMenuSubpageTriggerProps.
 */
export type SubpageTriggerRenderProps = {
  /**
   * Qualified unique ID for the subpage trigger.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   */
  value: string
  /**
   * Computed page ID for the associated Subpage content.
   * Must be passed to `targetPageId` on SubpageTrigger.
   */
  targetPageId: string
} & Required<Pick<PopupMenuSubpageTriggerProps, 'disabled'>>

/**
 * Parameters passed to subpage trigger render functions.
 */
export interface SubpageTriggerRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the SubpageTrigger */
  props: SubpageTriggerRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (SubpageDef.value) */
    value: string
    disabled: boolean
    /** Async loading state (if asyncNodes configured) */
    async?: AsyncRenderState
  }
}

/**
 * Parameters passed to subpage content render functions.
 * The returned JSX should include a `<PopupMenu.Subpage pageId={pageId}>` wrapper.
 */
export interface SubpageContentRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Computed page ID for this subpage */
  pageId: string
  /** Context for conditional rendering */
  context: RowRenderContext & {
    /** The node's value (SubpageDef.value) */
    value: string
    disabled: boolean
    /** Async loading state (if asyncNodes configured) */
    async?: AsyncRenderState
  }
  /**
   * The subpage's static child node definitions.
   * Does NOT include async results - use `asyncContent` for that.
   */
  nodes: NodeDef[]
  /**
   * Async content configuration for this subpage.
   * Pass this to the subpage's DataSurface to enable async loading
   * with the subpage's own search query (independent of parent search).
   */
  asyncContent?: AsyncNodesConfig
  /**
   * Function to render a child node.
   * Call this for each node in the subpage's list.
   */
  /** Resolved nodes are unwrapped to their defs. */
  renderNode: (node: NodeDef | PopupMenuNode) => React.ReactNode
}

// ============================================================================
// Group Render Types
// ============================================================================

/**
 * Context passed to group render functions.
 * Contains information about the group's state during search.
 */
export interface GroupRenderContext {
  /**
   * Search context with the best match score among items in this group.
   * `null` if no active search (browsing mode).
   */
  search: {
    /** Current search query */
    query: string
    /** Best match score among items in this group (higher = better match). */
    bestScore: number
  } | null

  /** Number of matching items in this group */
  matchCount: number

  /**
   * Breadcrumb nodes if this group is from a surfaced submenu.
   * Empty array [] for groups in the root menu.
   */
  breadcrumbs: BreadcrumbNode[]

  /** Whether this group is from deep search (surfaced from a submenu) */
  isDeepSearchResult: boolean
}

/**
 * Parameters passed to group render functions.
 */
export interface GroupRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props (empty for groups, but consistent structure) */
  props: Record<string, never>
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The group's label */
    label?: string
  }
  /** Pre-rendered matching children */
  children: React.ReactNode
}

/**
 * Parameters passed to group label render functions.
 */
export interface GroupLabelRenderParams {
  /** The resolved menu node for this group — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the label element (stable id for aria wiring) */
  props: { id: string }
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The group's label */
    label?: string
  }
}

// ============================================================================
// Checkbox Item Types
// ============================================================================

/**
 * Props to spread onto the CheckboxItem component.
 * Derived from PopupMenuCheckboxItemProps.
 */
export type CheckboxItemRenderProps = {
  /**
   * Qualified unique ID for the checkbox item.
   * Must be passed to the rendered component for navigation to work.
   */
  id: string
  /**
   * The original value from the node definition.
   */
  value: string
} & Required<Pick<PopupMenuCheckboxItemProps, 'disabled'>> &
  Pick<
    PopupMenuCheckboxItemProps,
    'checked' | 'onCheckedChange' | 'closeOnClick' | 'forceOrder' | 'forceScore'
  >

/**
 * Parameters passed to checkbox item render functions.
 */
export interface CheckboxItemRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the CheckboxItem component */
  props: CheckboxItemRenderProps
  /** Context for conditional rendering (includes props values for convenience) */
  context: RowRenderContext & {
    /** The node's value (CheckboxItemDef.value) */
    value: string
    checked?: boolean
    disabled: boolean
  }
}

// ============================================================================
// Radio Group Types
// ============================================================================

/**
 * Props to spread onto the RadioGroup component.
 * Derived from PopupMenuRadioGroupProps.
 */
export type RadioGroupRenderProps = Required<
  Pick<PopupMenuRadioGroupProps, 'disabled'>
> &
  Pick<PopupMenuRadioGroupProps, 'value' | 'onValueChange'>

/**
 * Parameters passed to radio group render functions.
 */
export interface RadioGroupRenderParams {
  /** The resolved menu node for this row — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the RadioGroup component */
  props: RadioGroupRenderProps
  /** Context for conditional rendering */
  context: GroupRenderContext & {
    /** The radio group's label */
    label?: string
    /** Current selected value */
    value?: string
    /** Whether the radio group is disabled */
    disabled: boolean
  }
  /** Pre-rendered radio items */
  children: React.ReactNode
}

/**
 * Parameters passed to radio group label render functions.
 */
export interface RadioGroupLabelRenderParams {
  /** The resolved menu node for this group — canonical identity (`node.id`), definition path, and tree links */
  node: PopupMenuNode
  /** Props to spread onto the label element (stable id for aria wiring) */
  props: { id: string }
  /** Context for conditional rendering (includes label for convenience) */
  context: GroupRenderContext & {
    /** The radio group's label */
    label?: string
    /** Current selected value */
    value?: string
    /** Whether the radio group is disabled */
    disabled: boolean
  }
}

// ============================================================================
// Node Definitions
// ============================================================================

/**
 * Base properties shared by all node types.
 */
interface BaseNodeDef {
  /**
   * Unique identifier for this node.
   * If provided, it contributes the Definition Key and encoded surface path;
   * Resolved ID generation otherwise follows the root policy or its
   * `getResolvedId` seam.
   */
  id?: string
  /** Whether this node is hidden */
  hidden?: boolean
}

/**
 * Item node definition.
 * Represents a selectable menu item.
 * Props derived from PopupMenuItemProps.
 */
export interface ItemDef
  extends BaseNodeDef,
    Required<Pick<PopupMenuItemProps, 'value'>>,
    Pick<
      PopupMenuItemProps,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'shortcut'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'item'
  /**
   * Render function for this item row.
   * Returns the JSX for the item.
   */
  render: (params: ItemRenderParams) => React.ReactNode
}

/** Tree item node definition. */
export interface TreeItemDef
  extends BaseNodeDef,
    Required<Pick<PopupMenuItemProps, 'value'>>,
    Pick<
      PopupMenuItemProps,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'tree-item'
  /** Whether this row itself can be selected. */
  selectable?: boolean
  /** Inline children rendered in the same list. */
  nodes?: NodeDef[]
  /** Whether descendants surface in deep search results. */
  deepSearch?: boolean
  /** Render function for this row. */
  render: (params: TreeItemRenderParams) => React.ReactNode
}

/**
 * Radio item node definition.
 * Represents a selectable radio menu item for use within RadioGroupDef.
 * Props derived from PopupMenuRadioItemProps.
 */
export interface RadioItemDef
  extends BaseNodeDef,
    Required<Pick<PopupMenuRadioItemProps, 'value'>>,
    Pick<
      PopupMenuRadioItemProps,
      | 'keywords'
      | 'disabled'
      | 'onSelect'
      | 'closeOnClick'
      | 'shortcut'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'radio-item'
  /**
   * Render function for this radio item row.
   * Returns the JSX for the radio item.
   */
  render: (params: RadioItemRenderParams) => React.ReactNode
}

/**
 * Checkbox item node definition.
 * Represents a toggleable checkbox menu item.
 * Props derived from PopupMenuCheckboxItemProps.
 */
export interface CheckboxItemDef
  extends BaseNodeDef,
    Pick<
      PopupMenuCheckboxItemProps,
      | 'keywords'
      | 'disabled'
      | 'checked'
      | 'onCheckedChange'
      | 'closeOnClick'
      | 'forceOrder'
      | 'forceScore'
    > {
  kind: 'checkbox-item'
  /**
   * Primary identifier and search text for this checkbox item.
   * Used for search matching and as the default identifier.
   */
  value: string
  /**
   * Render function for this checkbox item row.
   * Returns the JSX for the checkbox item.
   */
  render: (params: CheckboxItemRenderParams) => React.ReactNode
}

/**
 * Submenu node definition.
 * Represents a submenu trigger that opens a nested menu.
 * Props derived from PopupMenuSubmenuTriggerProps.
 */
export interface SubmenuDef
  extends BaseNodeDef,
    Required<Pick<PopupMenuSubmenuTriggerProps, 'value'>>,
    Pick<
      PopupMenuSubmenuTriggerProps,
      'keywords' | 'disabled' | 'forceOrder' | 'forceScore'
    > {
  kind: 'submenu'

  /** Static child nodes */
  nodes?: NodeDef[]

  /**
   * Async child nodes configuration.
   * When provided, the Loader component will be rendered to fetch async data.
   * Async nodes are merged with static nodes.
   */
  asyncNodes?: AsyncNodesConfig

  /**
   * Whether to include this submenu's descendants in deep search.
   * @default true
   */
  deepSearch?: boolean

  /**
   * Whether this submenu is included in ancestor deep search results.
   * - `true`: include submenu trigger and descendants
   * - `'trigger-only'`: include submenu trigger only
   * - `false`: exclude submenu trigger and descendants
   * @default true
   */
  includeInDeepSearch?: IncludeInDeepSearch

  /**
   * Render function for the entire submenu structure.
   * Should return the complete submenu: trigger, portal, positioner, popup, surface, list.
   */
  render: (params: SubmenuRenderParams) => React.ReactNode
}

/**
 * Subpage node definition.
 * Represents a trigger row that opens a page in the same popup.
 * Props derived from PopupMenuSubpageTriggerProps.
 */
export interface SubpageDef
  extends BaseNodeDef,
    Required<Pick<PopupMenuSubpageTriggerProps, 'value'>>,
    Pick<
      PopupMenuSubpageTriggerProps,
      'keywords' | 'disabled' | 'forceOrder' | 'forceScore'
    > {
  kind: 'subpage'

  /**
   * Optional explicit page ID for this subpage.
   * If omitted, a deterministic page ID is generated from id/value + breadcrumbs.
   */
  pageId?: string

  /** Static child nodes */
  nodes?: NodeDef[]

  /**
   * Async child nodes configuration.
   * When provided, the Loader component will be rendered to fetch async data.
   * Async nodes are merged with static nodes.
   */
  asyncNodes?: AsyncNodesConfig

  /**
   * Whether to include this subpage's descendants in deep search.
   * @default true
   */
  deepSearch?: boolean

  /**
   * Whether this subpage is included in ancestor deep search results.
   * - `true`: include subpage trigger and descendants
   * - `'trigger-only'`: include subpage trigger only
   * - `false`: exclude subpage trigger and descendants
   * @default true
   */
  includeInDeepSearch?: IncludeInDeepSearch

  /**
   * Render function for the trigger row.
   * Should return a `SubpageTrigger`.
   */
  renderTrigger: (params: SubpageTriggerRenderParams) => React.ReactNode

  /**
   * Render function for the subpage content.
   * Should return a `Subpage` rendered alongside the root Surface in Popup.
   */
  renderContent: (params: SubpageContentRenderParams) => React.ReactNode
}

/**
 * Render params for separator nodes.
 */
export interface SeparatorRenderParams {
  /** Props to spread on the separator element */
  props: {
    /** Unique identifier */
    id?: string
  }
}

/**
 * Separator node definition.
 * Represents a visual separator between items.
 */
export interface SeparatorDef {
  kind: 'separator'
  /** Unique identifier */
  id: string
  /** Optional render function for custom separator rendering */
  render?: (params: SeparatorRenderParams) => React.ReactNode
}

/**
 * Group node definition.
 * Represents a group of items with an optional label.
 */
export interface GroupDef {
  kind: 'group'
  /** Unique identifier for this group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Child nodes in this group */
  nodes: NodeDef[]
  /** Optional render function for the group container */
  render?: (params: GroupRenderParams) => React.ReactNode
  /**
   * Optional render function for the group's label row.
   * Used by the default group container when no `render` is provided, and by
   * virtualized lists (which ignore `render` and use only the label row).
   * Precedence: `render` > `renderLabel` > `label`.
   */
  renderLabel?: (params: GroupLabelRenderParams) => React.ReactNode
}

/**
 * Radio group node definition.
 * Represents a group of radio items where only one can be selected.
 * Props derived from PopupMenuRadioGroupProps.
 */
export interface RadioGroupDef
  extends Pick<
    PopupMenuRadioGroupProps,
    'value' | 'onValueChange' | 'disabled'
  > {
  kind: 'radio-group'
  /** Unique identifier for this radio group */
  id: string
  /** Optional group heading/label */
  label?: string
  /** Whether the radio group is hidden */
  hidden?: boolean
  /** Child nodes in this radio group - must be RadioItemDef nodes */
  nodes: RadioItemDef[]
  /** Optional render function for the radio group container */
  render?: (params: RadioGroupRenderParams) => React.ReactNode
  /**
   * Optional render function for the radio group's label row.
   * Used by the default radio group container when no `render` is provided, and by
   * virtualized lists (which ignore `render` and use only the label row).
   * Precedence: `render` > `renderLabel` > `label`.
   */
  renderLabel?: (params: RadioGroupLabelRenderParams) => React.ReactNode
}

/**
 * Helper function to create a radio group definition with proper typing.
 */
export function defineRadioGroup(def: RadioGroupDef): RadioGroupDef {
  return def
}

/**
 * Union of all node definition types.
 */
export type NodeDef =
  | ItemDef
  | TreeItemDef
  | RadioItemDef
  | CheckboxItemDef
  | SubmenuDef
  | SubpageDef
  | SeparatorDef
  | GroupDef
  | RadioGroupDef

// ============================================================================
// Scored Node - internal type for search results
// ============================================================================

/**
 * A node with its search score and breadcrumb path.
 * Used internally during filtering and scoring.
 */
export interface ScoredNode {
  /** The original node definition */
  node:
    | ItemDef
    | RadioItemDef
    | CheckboxItemDef
    | SubmenuDef
    | SubpageDef
    | TreeItemDef
  /** Search match score (higher = better match). */
  score: number
  /**
   * Breadcrumb nodes leading to this node.
   * Contains the full submenu definitions for maximum flexibility.
   */
  breadcrumbs: BreadcrumbNode[]
  /** The group this node belongs to, if any */
  group: { id: string; label?: string; groupDef: GroupDef } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
  } | null
}

// ============================================================================
// Display Node - node with render context attached
// ============================================================================

export type RowNodeDef =
  | ItemDef
  | RadioItemDef
  | CheckboxItemDef
  | SubmenuDef
  | SubpageDef
  | TreeItemDef

/**
 * A row node ready for display with its render context.
 * Used for items, radio items, checkbox items, and submenu triggers.
 */
export interface DisplayRowNode {
  kind: 'row'
  /** The resolved menu node; its authored definition is `node.def`. */
  node: PopupMenuNode<RowNodeDef>
  /** Pre-computed render context for this node */
  context: RowRenderContext
  /** Radio group this node belongs to, if rendering inside one */
  radioGroup?: { id: string; label?: string }
}

/**
 * A subpage content node ready for display with its render context.
 * Used by DataSubpages to render subpage content alongside the root Surface.
 */
export interface DisplaySubpageNode {
  /** The resolved node for this subpage. The authored def is `node.def`. */
  node: PopupMenuNode<SubpageDef>
  /** Pre-computed render context for this subpage trigger/content */
  context: RowRenderContext
  /** Computed page ID for this subpage */
  pageId: string
}

/**
 * A group node ready for display with its render context.
 * Contains the group definition and its matching items.
 */
export interface DisplayGroupNode {
  kind: 'group'
  /** The resolved node; authored def at node.def. */
  node: PopupMenuNode<GroupDef>
  /** Pre-computed render context for this group */
  context: GroupRenderContext
  /** Display nodes for items within this group */
  items: DisplayRowNode[]
  /** Best match score among items in this group */
  bestScore: number
}

/**
 * A radio group node ready for display with its render context.
 * Contains the radio group definition and its items.
 */
export interface DisplayRadioGroupNode {
  kind: 'radio-group'
  /** The resolved node; authored def at node.def. */
  node: PopupMenuNode<RadioGroupDef>
  /** Pre-computed render context for this radio group */
  context: GroupRenderContext
  /** Display nodes for items within this radio group */
  items: DisplayRowNode[]
  /** Best match score among items in this radio group */
  bestScore: number
}

/**
 * A separator node ready for display.
 */
export interface DisplaySeparatorNode {
  kind: 'separator'
  /** The resolved node; authored def at node.def. */
  node: PopupMenuNode<SeparatorDef>
}

/**
 * Union of all display node types.
 * Can be a row node (item/submenu/subpage), group node, radio group node, or separator.
 */
export type DisplayNode =
  | DisplayRowNode
  | DisplayGroupNode
  | DisplayRadioGroupNode
  | DisplaySeparatorNode

/**
 * Type guard for DisplayGroupNode.
 */
export function isDisplayGroupNode(
  node: DisplayNode,
): node is DisplayGroupNode {
  return 'kind' in node && node.kind === 'group'
}

/**
 * Type guard for DisplayRadioGroupNode.
 */
export function isDisplayRadioGroupNode(
  node: DisplayNode,
): node is DisplayRadioGroupNode {
  return 'kind' in node && node.kind === 'radio-group'
}

/**
 * Type guard for DisplaySeparatorNode.
 */
export function isDisplaySeparatorNode(
  node: DisplayNode,
): node is DisplaySeparatorNode {
  return 'kind' in node && node.kind === 'separator'
}

/**
 * Type guard for DisplayRowNode (items, checkbox items, submenus, subpages).
 */
export function isDisplayRowNode(node: DisplayNode): node is DisplayRowNode {
  return 'kind' in node && node.kind === 'row'
}

// ============================================================================
// Deep Search Configuration
// ============================================================================

/**
 * Defines how groups behave during deep search.
 * - 'flatten': Groups become invisible, items shown in flat list by score.
 * - 'preserve': Groups are shown as containers with their matching items.
 * Note: Radio groups are ALWAYS preserved regardless of this setting.
 */
export type GroupBehavior = 'flatten' | 'preserve'

/**
 * Defines how radio groups behave during deep search.
 * - 'flatten': Radio group items are shown individually in the flat list (not recommended).
 * - 'preserve': Radio group is shown with only matching items visible.
 * - 'preserve-show-all': Radio group is shown with ALL items visible when any item matches.
 *   This is useful when you want users to see all options in a radio group.
 */
export type RadioGroupBehavior = 'flatten' | 'preserve' | 'preserve-show-all'

/**
 * Defines how deep-search async results are revealed.
 * - 'stream': show available results immediately and append new async batches as they resolve.
 * - 'block': hide all deep-search rows until every participating async loader resolves.
 */
export type AsyncResultBehavior = 'stream' | 'block'

/**
 * Configuration for deep search behavior.
 */
export interface DeepSearchConfig {
  /** Whether deep search is enabled */
  enabled?: boolean
  /** Minimum query length before deep search activates */
  minLength?: number
  /**
   * How groups behave during search results.
   * Only affects search mode - groups are always shown in browse mode.
   * Note: Radio groups have their own behavior controlled by radioGroupSearchBehavior.
   * @default 'preserve'
   */
  groupSearchBehavior?: GroupBehavior
  /**
   * How radio groups behave during search results.
   * - 'flatten': Radio items shown individually (not recommended).
   * - 'preserve': Only matching radio items are shown (default).
   * - 'preserve-show-all': All radio items are shown when any item matches.
   * @default 'preserve'
   */
  radioGroupSearchBehavior?: RadioGroupBehavior
  /**
   * Whether to sort groups by their best-matching item's score.
   * Only applies when groupSearchBehavior: 'preserve'.
   * @default true
   */
  sortGroups?: boolean
  /**
   * How async deep-search results are revealed.
   * - 'stream': emit available results immediately, append later async batches (default)
   * - 'block': show loading state only until all loaders resolve, then render once
   * @default 'stream'
   */
  asyncResultBehavior?: AsyncResultBehavior
}

// ============================================================================
// Data Surface Props
// ============================================================================

/**
 * Props for the DataSurface component.
 */
export interface DataSurfaceProps {
  /**
   * The menu content (node definitions with render functions). Resolved nodes
   * are accepted anywhere defs are; they are unwrapped to their defs, and
   * re-supplying the same nodes preserves identity.
   */
  content?: NodeDef[] | PopupMenuNode[]

  /**
   * Async content configuration for root-level async loading.
   * When provided, the Loader component will be rendered to fetch async data.
   * Async content is merged with static content.
   */
  asyncContent?: AsyncLoaderConfig

  /** Deep search configuration */
  deepSearch?: DeepSearchConfig | boolean

  /**
   * Default inclusion mode for descendant branch nodes in deep search results.
   * Submenus/subpages can override via `includeInDeepSearch`.
   * @default true
   */
  includeInDeepSearch?: IncludeInDeepSearch

  /** Filter function or false to disable filtering */
  filter?:
    | ((value: string, search: string, keywords?: string[]) => number)
    | false

  /**
   * Transforms search input before filtering and visibility logic.
   * @default trim whitespace (`search.trim()`)
   */
  normalizeSearch?: (search: string) => string

  /** Controlled search value */
  search?: string

  /** Callback when search value changes */
  onSearchChange?: (search: string) => void

  /** Default search value for uncontrolled usage */
  defaultSearch?: string

  /** Whether navigation should loop */
  loop?: boolean

  /** Auto-highlight behavior when menu opens */
  autoHighlightFirst?: boolean | string

  /**
   * Whether to clear search on close.
   * - `true`: clear immediately when menu closes (default)
   * - `false`: preserve search when menu closes
   * - `'after-exit'`: clear after exit animation completes
   */
  clearSearchOnClose?: boolean | 'after-exit'

  /**
   * Whether to reset the list scroll position when the search query changes.
   * @default true
   */
  resetScrollOnSearch?: boolean

  /** Children (Input, List, etc.) */
  children: React.ReactNode
}

// ============================================================================
// Data List Props
// ============================================================================

/**
 * State passed to the DataList render function.
 */
export interface DataListChildrenState {
  /** Current search query (empty string if browsing) */
  search: string

  /**
   * Display nodes (filtered and scored if searching).
   * Can include groups (DisplayGroupNode) or radio groups (DisplayRadioGroupNode)
   * when groupSearchBehavior: 'preserve'.
   */
  nodes: DisplayNode[]

  /**
   * Function to render a node.
   * Handles items, submenus, groups, and radio groups, calling their render functions with context.
   */
  renderNode: (displayNode: DisplayNode) => React.ReactNode

  /** Number of visible items (counting items inside groups) */
  count: number

  /** Whether deep search is active (query length >= minLength) */
  isDeepSearching: boolean

  /** Aggregate async loading state across all menus */
  async: AsyncState
}

/**
 * Props for the DataList component.
 */
export interface DataListProps {
  /** List content. Descendants read node state via `useDataList()`. */
  children: React.ReactNode

  /** Accessible label for the listbox */
  label?: string

  /** Additional class name */
  className?: string

  /** Additional styles */
  style?: React.CSSProperties

  /**
   * When true, measures row widths and applies `--row-width` CSS variable.
   * Keeps the list at the maximum width seen while scrolling.
   * Useful for virtualized lists where content width varies.
   * @default true
   */
  measureRowWidth?: boolean

  /**
   * Maximum width cap for row measurement (in pixels).
   * Only used when `measureRowWidth` is true.
   */
  maxRowWidth?: number

  /**
   * Ref to the element that owns the list's scroll position.
   * Use when the semantic list is rendered inside another scroll container.
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

// ============================================================================
// Data Subpages Props
// ============================================================================

/**
 * State passed to the DataSubpages render function.
 */
export interface DataSubpagesChildrenState {
  /** All subpage content nodes discovered in the current content tree. */
  subpages: DisplaySubpageNode[]

  /**
   * Function to render a subpage content node.
   * Calls the node's `renderContent` callback with page context and child renderer.
   */
  renderSubpageContent: (subpage: DisplaySubpageNode) => React.ReactNode
}

/**
 * Props for the DataSubpages component.
 */
export interface DataSubpagesProps {
  /**
   * Optional render function.
   * If omitted, all subpage contents are rendered by default.
   */
  children?: (state: DataSubpagesChildrenState) => React.ReactNode
}
