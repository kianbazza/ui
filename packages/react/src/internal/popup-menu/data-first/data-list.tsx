'use client'

import * as React from 'react'
import {
  useListboxContext,
  type useSurfaceContext,
} from '../../listbox/index.js'
import { PopupMenuGroupLabel } from '../components/group-label/group-label.js'
import {
  PopupMenuListPrimitive,
  type PopupMenuListProps,
} from '../components/list/list.js'
import {
  GraftPointContext,
  useGraftPoint,
} from '../contexts/graft-point-context.js'
import { useMenuTreeResolver } from '../contexts/menu-tree-resolver-context.js'
import { useMaybeSubpageContext } from '../contexts/subpage-context.js'
import { useMaybeSubpageStack } from '../contexts/subpage-stack-context.js'
import { useResolution } from '../hooks/use-resolution.js'
import { staticChildrenOf } from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import {
  type AsyncMenuState,
  useAsyncMenuCoordinator,
} from './async-coordinator.js'
import {
  DataListContext,
  type RenderNodeFn,
  useDataPopupContext,
  useDataSurfaceContext,
} from './context.js'
import { isRowMenuNode } from './type-guards.js'
import type {
  AsyncLoaderResult,
  AsyncNodesConfig,
  BreadcrumbNode,
  CheckboxItemDef,
  DataListChildrenState,
  DisplayNode,
  DisplayRowNode,
  GroupDef,
  GroupRenderContext,
  ItemDef,
  NodeDef,
  QueryLoaderConfig,
  RadioGroupDef,
  RowRenderContext,
  SubmenuDef,
  SubpageDef,
} from './types.js'
import {
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplaySeparatorNode,
} from './types.js'
import {
  type AsyncSubmenuInfo,
  collectAsyncSubmenus,
  filterNodes,
  getAsyncLoaderIdForBranch,
  shouldLoadEagerly,
} from './utils.js'

function renderGroupLabelElement<
  C extends GroupRenderContext & { label?: string },
>(
  groupId: string,
  label: string | undefined,
  renderLabel:
    | ((params: {
        node: PopupMenuNode
        props: { id: string }
        context: C
      }) => React.ReactNode)
    | undefined,
  node: PopupMenuNode,
  context: C,
): React.ReactNode {
  if (!label && !renderLabel) return null
  const labelId = `${groupId}-label`
  if (renderLabel) {
    return (
      <React.Fragment key={labelId}>
        {renderLabel({ node, props: { id: labelId }, context })}
      </React.Fragment>
    )
  }
  return (
    <PopupMenuGroupLabel key={labelId} id={labelId}>
      {label}
    </PopupMenuGroupLabel>
  )
}

// ============================================================================
// Helper: Extract ordered resolved IDs for store navigation
// ============================================================================
function getOrderedItemIds(displayNodes: DisplayNode[]): string[] {
  const ids: string[] = []

  for (const displayNode of displayNodes) {
    if (isDisplayGroupNode(displayNode)) {
      for (const item of displayNode.items) {
        // Header tree rows are intentionally included: they are highlightable even when non-activatable.
        if (!item.node.def.disabled && item.node.id) {
          ids.push(item.node.id)
        }
      }
    } else if (isDisplayRadioGroupNode(displayNode)) {
      for (const item of displayNode.items) {
        // Header tree rows are intentionally included: they are highlightable even when non-activatable.
        if (!item.node.def.disabled && item.node.id) {
          ids.push(item.node.id)
        }
      }
    } else if (isDisplaySeparatorNode(displayNode)) {
      // skip
    } else {
      if (!displayNode.node.def.disabled && displayNode.node.id) {
        ids.push(displayNode.node.id)
      }
    }
  }

  return ids
}

function isAppendOnlyOrderedItemsUpdate(
  previousIds: string[],
  nextIds: string[],
): boolean {
  if (previousIds.length === 0 || nextIds.length <= previousIds.length) {
    return false
  }

  for (let i = 0; i < previousIds.length; i++) {
    if (previousIds[i] !== nextIds[i]) {
      return false
    }
  }

  return true
}

function getBreadcrumbStreamKey(breadcrumbs: BreadcrumbNode[]): string {
  return breadcrumbs
    .map((breadcrumb) => breadcrumb.id ?? breadcrumb.value)
    .join('>')
}

function getDisplayNodeStreamKey(displayNode: DisplayNode): string {
  if (isDisplayGroupNode(displayNode)) {
    return `group:${displayNode.node.def.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplayRadioGroupNode(displayNode)) {
    return `radio-group:${displayNode.node.def.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplaySeparatorNode(displayNode)) {
    return `separator:${displayNode.node.def.id ?? 'separator'}`
  }

  return `row:${displayNode.node.def.kind}:${displayNode.node.def.id ?? ''}:${displayNode.node.def.value}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
}

const identityQuery = (query: string) => query

function orderDisplayNodesForStreaming(
  displayNodes: DisplayNode[],
  previousOrder: string[],
): {
  orderedNodes: DisplayNode[]
  nextOrder: string[]
} {
  const currentEntries = displayNodes.map(
    (node) => [getDisplayNodeStreamKey(node), node] as const,
  )

  const currentByKey = new Map(currentEntries)
  const currentOrder = currentEntries.map(([key]) => key)

  const preservedOrder = previousOrder.filter((key) => currentByKey.has(key))
  const preservedKeysSet = new Set(preservedOrder)
  const appendedOrder = currentOrder.filter((key) => !preservedKeysSet.has(key))
  const nextOrder = [...preservedOrder, ...appendedOrder]

  const orderedNodes = nextOrder
    .map((key) => currentByKey.get(key))
    .filter((node): node is DisplayNode => node !== undefined)

  return { orderedNodes, nextOrder }
}

// ============================================================================
// Async Loader Component
// ============================================================================

interface AsyncLoaderRendererProps {
  info: AsyncSubmenuInfo
  query: string
  enabled: boolean
}

interface QueryExecutionState {
  effectiveQuery: string
  enabled: boolean
  isBelowMinLength: boolean
}

function resolveInitialQueryBehavior(config: QueryLoaderConfig):
  | {
      value: string
      loadWhen: 'needed' | 'parent-open'
    }
  | false {
  if (config.initialQueryBehavior !== undefined) {
    if (config.initialQueryBehavior === false) {
      return false
    }
    return {
      value: config.initialQueryBehavior.value ?? '',
      loadWhen: config.initialQueryBehavior.loadWhen ?? 'needed',
    }
  }

  if (config.initialQuery !== undefined) {
    return { value: config.initialQuery, loadWhen: 'needed' }
  }

  return { value: '', loadWhen: 'needed' }
}

function resolveQueryExecutionState(
  config: QueryLoaderConfig,
  query: string,
): QueryExecutionState {
  const minLength = config.minQueryLength ?? 1
  const initialQueryBehavior = resolveInitialQueryBehavior(config)

  if (query.length >= minLength) {
    return {
      effectiveQuery: query,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  if (initialQueryBehavior !== false) {
    return {
      effectiveQuery: initialQueryBehavior.value,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  return {
    effectiveQuery: '',
    enabled: false,
    isBelowMinLength: true,
  }
}

/**
 * Renders an async loader component and registers its state with the coordinator.
 * This component exists solely to call the Loader component (which contains hooks).
 */
function AsyncLoaderRenderer({
  info,
  query,
  enabled,
}: AsyncLoaderRendererProps) {
  const coordinator = useAsyncMenuCoordinator()
  const { config, id, breadcrumbs } = info
  const Loader = config.Loader

  const queryExecution = React.useMemo(() => {
    if (config.type !== 'query') {
      return null
    }

    return resolveQueryExecutionState(config, query)
  }, [config, query])

  const effectiveQuery = queryExecution?.effectiveQuery ?? query
  const shouldFetch = queryExecution?.enabled ?? true

  // Track if this loader should be active
  const isActive = enabled || shouldLoadEagerly(config)

  if (!isActive) {
    return null
  }

  return (
    <Loader query={effectiveQuery} enabled={shouldFetch}>
      {(result) => (
        <AsyncLoaderResultHandler
          id={id}
          breadcrumbs={breadcrumbs}
          config={config}
          result={result}
          coordinator={coordinator}
        />
      )}
    </Loader>
  )
}

interface AsyncLoaderResultHandlerProps {
  id: string
  breadcrumbs: string[]
  config: AsyncNodesConfig
  result: AsyncLoaderResult<NodeDef[]>
  coordinator: ReturnType<typeof useAsyncMenuCoordinator>
}

/**
 * Handles registering and updating loader results with the coordinator.
 * This is a separate component to avoid re-rendering the Loader on every result change.
 */
function AsyncLoaderResultHandler({
  id,
  breadcrumbs,
  config,
  result,
  coordinator,
}: AsyncLoaderResultHandlerProps) {
  // Use refs to hold the latest values without causing re-renders
  // This is critical because coordinator changes on every state update (new Map)
  const breadcrumbsRef = React.useRef(breadcrumbs)
  const configRef = React.useRef(config)
  const coordinatorRef = React.useRef(coordinator)
  const resultRef = React.useRef(result)

  // Track previous result values to avoid unnecessary updates
  // TanStack Query returns new object references on every render
  const prevResultRef = React.useRef<{
    data: unknown
    status: string
    fetchStatus: string
    loadingPhase: string
    isLoading: boolean
    isFetching: boolean
    isInitialLoading: boolean
    isRefetching: boolean
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    isPaused: boolean
    hasData: boolean
    hasFetched: boolean
    error: Error | null
  } | null>(null)

  // Keep refs up to date
  breadcrumbsRef.current = breadcrumbs
  configRef.current = config
  coordinatorRef.current = coordinator
  resultRef.current = result

  // Register on mount, unregister on unmount
  // IMPORTANT: Only depend on `id` - coordinator is accessed via ref to avoid
  // infinite loops (coordinator object changes on every state update)
  React.useEffect(() => {
    const coord = coordinatorRef.current
    if (!coord) return

    const state: AsyncMenuState = {
      id,
      breadcrumbs: breadcrumbsRef.current,
      config: configRef.current,
      result: resultRef.current,
    }

    coord.registerLoader(state)

    return () => {
      coord.unregisterLoader(id)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update result when meaningful values change
  // IMPORTANT: Depend on individual result values, not the result object reference.
  // TanStack Query creates new object references on every render, but we only want
  // to trigger updates when actual values change.
  // Using coordinatorRef prevents re-running when coordinator context changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally field-granular — the result object has a new identity every render (see comment above)
  React.useEffect(() => {
    const coord = coordinatorRef.current
    if (!coord) return

    // Compare against previous values to avoid unnecessary updates
    const prev = prevResultRef.current
    const hasChanged =
      prev === null ||
      prev.data !== result.data ||
      prev.status !== result.status ||
      prev.fetchStatus !== result.fetchStatus ||
      prev.loadingPhase !== result.loadingPhase ||
      prev.isLoading !== result.isLoading ||
      prev.isFetching !== result.isFetching ||
      prev.isInitialLoading !== result.isInitialLoading ||
      prev.isRefetching !== result.isRefetching ||
      prev.isPending !== result.isPending ||
      prev.isSuccess !== result.isSuccess ||
      prev.isError !== result.isError ||
      prev.isPaused !== result.isPaused ||
      prev.hasData !== result.hasData ||
      prev.hasFetched !== result.hasFetched ||
      prev.error !== result.error

    if (hasChanged) {
      prevResultRef.current = {
        data: result.data,
        status: result.status,
        fetchStatus: result.fetchStatus,
        loadingPhase: result.loadingPhase,
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        isInitialLoading: result.isInitialLoading,
        isRefetching: result.isRefetching,
        isPending: result.isPending,
        isSuccess: result.isSuccess,
        isError: result.isError,
        isPaused: result.isPaused,
        hasData: result.hasData,
        hasFetched: result.hasFetched,
        error: result.error,
      }
      coord.updateLoaderResult(id, result)
    }
  }, [
    id,
    result.data,
    result.status,
    result.fetchStatus,
    result.loadingPhase,
    result.isLoading,
    result.isFetching,
    result.isInitialLoading,
    result.isRefetching,
    result.isPending,
    result.isSuccess,
    result.isError,
    result.isPaused,
    result.hasData,
    result.hasFetched,
    result.error,
  ])

  return null
}

// ============================================================================
// Root Async Loader Component
// ============================================================================

interface RootAsyncLoaderProps {
  query: string
}

/**
 * Renders the root async content loader if configured.
 */
function RootAsyncLoader({ query }: RootAsyncLoaderProps) {
  const dataSurfaceCtx = useDataSurfaceContext()
  const coordinator = useAsyncMenuCoordinator()
  const { asyncContent } = dataSurfaceCtx

  const queryExecution = React.useMemo(() => {
    if (asyncContent?.type !== 'query') {
      return null
    }

    return resolveQueryExecutionState(asyncContent, query)
  }, [asyncContent, query])

  const effectiveQuery = queryExecution?.effectiveQuery ?? query
  const shouldFetch = queryExecution?.enabled ?? true

  if (!asyncContent) {
    return null
  }

  const Loader = asyncContent.Loader

  return (
    <Loader query={effectiveQuery} enabled={shouldFetch}>
      {(result) => (
        <AsyncLoaderResultHandler
          id="__root__"
          breadcrumbs={[]}
          config={asyncContent as AsyncNodesConfig}
          result={result}
          coordinator={coordinator}
        />
      )}
    </Loader>
  )
}

// ============================================================================
// DataList Inner Component (with coordinator access)
// ============================================================================

export interface DataListInnerProps extends PopupMenuListProps {
  content: NodeDef[]
  asyncContent: ReturnType<typeof useDataSurfaceContext>['asyncContent']
  deepSearchConfig: ReturnType<typeof useDataSurfaceContext>['deepSearchConfig']
  includeInDeepSearch: ReturnType<
    typeof useDataSurfaceContext
  >['includeInDeepSearch']
  search: string
  normalizedSearch: string
  store: ReturnType<typeof useSurfaceContext>['store']
}

export const DataListInner = React.forwardRef<
  HTMLDivElement,
  DataListInnerProps
>(function DataListInner(props, forwardedRef) {
  const {
    children,
    content,
    asyncContent,
    deepSearchConfig,
    includeInDeepSearch,
    search,
    normalizedSearch,
    store,
    label = 'Menu',
    remeasureDependencies,
    ...listProps
  } = props

  const resolver = useMenuTreeResolver()
  const { setResolvedNodes } = useDataPopupContext()
  const graftParent = useGraftPoint()
  const { depth: surfaceDepth } = useListboxContext()
  const resolverSubpageContext = useMaybeSubpageContext()
  const resolverSubpageStack = useMaybeSubpageStack()
  // Mirrors surface.tsx's isSubpageSurfaceInThisPopup: a data surface
  // rendered as a subpage of this popup must never feed resolution.
  const isSubpageSurface = Boolean(
    resolverSubpageContext &&
      resolverSubpageStack?.getSurfaceId(resolverSubpageContext.pageId),
  )
  const isResolutionRoot = surfaceDepth === 0 && !isSubpageSurface

  // Get coordinator for async state
  const coordinator = useAsyncMenuCoordinator()

  // Collect async submenus from content
  const asyncSubmenus = React.useMemo(
    () => collectAsyncSubmenus(content, [], includeInDeepSearch),
    [content, includeInDeepSearch],
  )

  // Determine if deep search is active
  const minLength = deepSearchConfig.minLength ?? 0
  const isDeepSearchActive =
    deepSearchConfig.enabled !== false && normalizedSearch.length >= minLength

  // Determine which async loaders should be rendered
  const shouldRenderAsyncLoaders =
    isDeepSearchActive ||
    asyncSubmenus.some((s) => shouldLoadEagerly(s.config)) ||
    (asyncContent && asyncContent.loadStrategy === 'eager')

  const { nodes: resolvedNodes, graftVersion } = useResolution({
    resolver,
    content,
    asyncContent,
    coordinator,
    graftParent,
    isSubpageSurface,
    isResolutionRoot,
    asyncSubmenus,
  })

  // Publish the resolved-nodes slot for sibling subpages. Not withdrawn on
  // unmount: the root list unmounts while a subpage is active, and the
  // subpages must keep rendering from the tree that opened them.
  React.useEffect(() => {
    if (isSubpageSurface) return
    setResolvedNodes({ nodes: resolvedNodes, graftVersion, content })
  }, [isSubpageSurface, setResolvedNodes, resolvedNodes, graftVersion, content])

  // A subpage surface grafts into the same Menu Tree (its own loader results
  // under its branch). Bump the slot's version so sibling subpage collection
  // sees nested subpages those grafts introduced.
  const lastPublishedSubpageGraftRef = React.useRef(0)
  React.useEffect(() => {
    if (!isSubpageSurface || graftVersion === 0) return
    if (lastPublishedSubpageGraftRef.current === graftVersion) return
    lastPublishedSubpageGraftRef.current = graftVersion
    setResolvedNodes((current) =>
      current
        ? { ...current, graftVersion: current.graftVersion + 1 }
        : current,
    )
  }, [isSubpageSurface, setResolvedNodes, graftVersion])

  const streamOrderRef = React.useRef<{
    query: string
    order: string[]
  } | null>(null)

  // Compute filtered display nodes
  // biome-ignore lint/correctness/useExhaustiveDependencies: graftVersion signals grafts under branch nodes, which mutate `children` without changing `resolvedNodes` identity
  const { displayNodes, isDeepSearching } = React.useMemo(() => {
    const result = filterNodes({
      query: normalizedSearch,
      normalizeQuery: identityQuery,
      nodes: resolvedNodes,
      highlightedId: null, // Primitives handle highlighting via store
      deepSearch: deepSearchConfig.enabled,
      includeInDeepSearch,
      minLength: deepSearchConfig.minLength,
      groupSearchBehavior: deepSearchConfig.groupSearchBehavior,
      radioGroupSearchBehavior: deepSearchConfig.radioGroupSearchBehavior,
      sortGroups: deepSearchConfig.sortGroups,
    })

    const asyncResultBehavior = deepSearchConfig.asyncResultBehavior ?? 'stream'
    const expectedAsyncLoaderCount =
      asyncSubmenus.length + (asyncContent ? 1 : 0)
    const hasAsyncSources = expectedAsyncLoaderCount > 0

    const shouldBlockAsyncResults =
      asyncResultBehavior === 'block' &&
      result.isDeepSearching &&
      hasAsyncSources &&
      coordinator !== null &&
      (coordinator.loaders.size < expectedAsyncLoaderCount ||
        coordinator.isAnyLoading)

    let displayNodesToRender = result.displayNodes

    if (shouldBlockAsyncResults) {
      streamOrderRef.current = null
      displayNodesToRender = []
    } else if (asyncResultBehavior === 'stream' && result.isDeepSearching) {
      const previousStreamState = streamOrderRef.current

      if (
        !previousStreamState ||
        previousStreamState.query !== normalizedSearch
      ) {
        streamOrderRef.current = {
          query: normalizedSearch,
          order: displayNodesToRender.map(getDisplayNodeStreamKey),
        }
      } else {
        const { orderedNodes, nextOrder } = orderDisplayNodesForStreaming(
          displayNodesToRender,
          previousStreamState.order,
        )

        displayNodesToRender = orderedNodes
        streamOrderRef.current = {
          query: normalizedSearch,
          order: nextOrder,
        }
      }
    } else {
      streamOrderRef.current = null
    }

    return {
      displayNodes: displayNodesToRender,
      isDeepSearching: result.isDeepSearching,
    }
  }, [
    normalizedSearch,
    resolvedNodes,
    graftVersion,
    deepSearchConfig,
    includeInDeepSearch,
    asyncSubmenus.length,
    asyncContent,
    coordinator,
    coordinator?.isAnyLoading,
    coordinator?.loaders,
  ])

  // Sync orderedItems with the store when display nodes change
  // This is needed because DataSurface sets filter={false} on the underlying Surface
  //
  // We use a ref to track the previous IDs and do a deep comparison to avoid
  // triggering highlight resets when the content hasn't actually changed.
  const prevOrderedItemIdsRef = React.useRef<string[]>([])
  const prevOrderedItemsSearchRef = React.useRef<string | null>(null)
  const orderedItemsUpdateReasonRef = React.useRef<'replace' | 'append'>(
    'replace',
  )

  // Compute new ordered resolved IDs
  const newOrderedItemIds = React.useMemo(
    () => getOrderedItemIds(displayNodes),
    [displayNodes],
  )

  // Memoize the ordered IDs, only returning a new array if content changed
  const orderedItemIds = React.useMemo(() => {
    const prev = prevOrderedItemIdsRef.current
    const current = newOrderedItemIds

    // Deep comparison
    const changed =
      prev.length !== current.length || prev.some((id, i) => id !== current[i])

    if (changed) {
      const asyncResultBehavior =
        deepSearchConfig.asyncResultBehavior ?? 'stream'
      const shouldUseAppendReason =
        asyncResultBehavior === 'stream' &&
        isDeepSearching &&
        prevOrderedItemsSearchRef.current === normalizedSearch &&
        isAppendOnlyOrderedItemsUpdate(prev, current)

      orderedItemsUpdateReasonRef.current = shouldUseAppendReason
        ? 'append'
        : 'replace'
      prevOrderedItemIdsRef.current = current
      prevOrderedItemsSearchRef.current = normalizedSearch
      return current
    }

    return prev
  }, [
    newOrderedItemIds,
    deepSearchConfig.asyncResultBehavior,
    isDeepSearching,
    normalizedSearch,
  ])

  React.useEffect(() => {
    store.setOrderedItems(orderedItemIds, {
      reason: orderedItemsUpdateReasonRef.current,
    })
  }, [store, orderedItemIds])

  // Helper to render a single row node (item, checkbox item, submenu, or subpage)
  // biome-ignore lint/correctness/useExhaustiveDependencies: renderRowNode and renderRadioGroup are intentionally recursive.
  const renderRowNode = React.useCallback(
    (displayNode: DisplayRowNode): React.ReactNode => {
      const resolved = displayNode.node
      const node = resolved.def
      const { context } = displayNode

      const id = resolved.id

      const getBranchAsyncState = (branchNode: SubmenuDef | SubpageDef) => {
        if (!branchNode.asyncNodes || !coordinator) {
          return undefined
        }

        const asyncLoaderId = getAsyncLoaderIdForBranch(
          branchNode,
          context.breadcrumbs,
        )
        const asyncResult = coordinator.loaders.get(asyncLoaderId)

        if (!asyncResult) {
          return undefined
        }

        const isBelowMinLength =
          branchNode.asyncNodes.type === 'query'
            ? resolveQueryExecutionState(
                branchNode.asyncNodes,
                normalizedSearch,
              ).isBelowMinLength
            : false

        return {
          status: asyncResult.result.status,
          fetchStatus: asyncResult.result.fetchStatus,
          loadingPhase: asyncResult.result.loadingPhase,
          isLoading: asyncResult.result.isLoading,
          isFetching: asyncResult.result.isFetching,
          isInitialLoading: asyncResult.result.isInitialLoading,
          isRefetching: asyncResult.result.isRefetching,
          isError: asyncResult.result.isError,
          error: asyncResult.result.error,
          isBelowMinLength,
        }
      }

      if (node.kind === 'item') {
        return (
          <React.Fragment key={id}>
            {node.render({
              node: resolved,
              props: {
                id,
                value: node.value,
                disabled: node.disabled ?? false,
                closeOnClick: node.closeOnClick,
                onSelect: node.onSelect,
                shortcut: node.shortcut,
                forceOrder: node.forceOrder,
                forceScore: node.forceScore,
              },
              context: {
                ...context,
                value: node.value,
                disabled: node.disabled ?? false,
              },
            })}
          </React.Fragment>
        )
      }

      if (node.kind === 'tree-item') {
        return (
          <React.Fragment key={id}>
            {node.render({
              node: resolved,
              props: {
                id,
                value: node.value,
                disabled: node.disabled ?? false,
                selectable: node.selectable !== false,
                closeOnClick: node.closeOnClick,
                onSelect: node.onSelect,
                forceOrder: node.forceOrder,
                forceScore: node.forceScore,
              },
              context: {
                ...context,
                value: node.value,
                disabled: node.disabled ?? false,
              },
            })}
          </React.Fragment>
        )
      }

      if (node.kind === 'radio-item') {
        return (
          <React.Fragment key={id}>
            {node.render({
              node: resolved,
              props: {
                id,
                value: node.value,
                disabled: node.disabled ?? false,
                closeOnClick: node.closeOnClick,
                onSelect: node.onSelect,
                shortcut: node.shortcut,
                forceOrder: node.forceOrder,
                forceScore: node.forceScore,
              },
              context: {
                ...context,
                value: node.value,
                disabled: node.disabled ?? false,
              },
            })}
          </React.Fragment>
        )
      }

      if (node.kind === 'checkbox-item') {
        return (
          <React.Fragment key={id}>
            {node.render({
              node: resolved,
              props: {
                id,
                value: node.value,
                checked: node.checked,
                onCheckedChange: node.onCheckedChange,
                disabled: node.disabled ?? false,
                closeOnClick: node.closeOnClick,
                forceOrder: node.forceOrder,
                forceScore: node.forceScore,
              },
              context: {
                ...context,
                value: node.value,
                checked: node.checked,
                disabled: node.disabled ?? false,
              },
            })}
          </React.Fragment>
        )
      }

      if (node.kind === 'submenu') {
        // For submenus, provide the nodes and a recursive renderNode function
        // Note: We pass the resolved id to the submenu trigger so it registers with the
        // correct ID for keyboard navigation during deep search
        const submenuAsyncState = getBranchAsyncState(node)

        // Static nodes only - async content is handled by the submenu's own DataSurface
        const staticChildren = staticChildrenOf(resolved)

        // Create breadcrumb node for current submenu (used in child contexts)
        const submenuBreadcrumb: BreadcrumbNode = {
          node,
          menuNode: resolved as PopupMenuNode<SubmenuDef>,
          value: node.value,
          id: node.id,
        }

        const submenuRenderNode = (arg: PopupMenuNode): React.ReactNode => {
          const childMenuNode = arg
          const childNode = arg.def
          // Skip separators
          if (childNode.kind === 'separator') {
            return null
          }

          // Handle groups - render the group with its children
          if (childNode.kind === 'group') {
            const groupItems = childMenuNode.children.filter(
              (
                n,
              ): n is PopupMenuNode<
                ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
              > =>
                isRowMenuNode(n) &&
                (n.kind === 'item' ||
                  n.kind === 'checkbox-item' ||
                  n.kind === 'submenu' ||
                  n.kind === 'subpage') &&
                !n.def.hidden,
            )

            if (groupItems.length === 0) {
              return null
            }

            // Render group items - renderRowNode already wraps in keyed Fragment
            const groupChildren = groupItems.map((item) => {
              const itemContext: RowRenderContext = {
                search: null,
                breadcrumbs: [...context.breadcrumbs, submenuBreadcrumb],
                isDeepSearchResult: false,
                highlighted: false,
                disabled: item.def.disabled ?? false,
                group: { id: childNode.id, label: childNode.label },
                tree: null,
              }

              return renderRowNode({
                kind: 'row',
                node: item,
                context: itemContext,
              })
            })

            // Use custom group render if provided
            if (childNode.render) {
              const groupContext: GroupRenderContext = {
                search: null,
                matchCount: groupItems.length,
                breadcrumbs: [...context.breadcrumbs, submenuBreadcrumb],
                isDeepSearchResult: false,
              }
              return (
                <React.Fragment key={childNode.id}>
                  {childNode.render({
                    node: childMenuNode as PopupMenuNode<GroupDef>,
                    props: {},
                    context: {
                      ...groupContext,
                      label: childNode.label,
                    },
                    children: <>{groupChildren}</>,
                  })}
                </React.Fragment>
              )
            }

            // Default group rendering
            return (
              // biome-ignore lint/a11y/useSemanticElements: ignore for now
              <div key={childNode.id} role="group" aria-label={childNode.label}>
                {groupChildren}
              </div>
            )
          }

          // Handle radio groups inside submenus
          if (childNode.kind === 'radio-group') {
            return renderRadioGroup(
              childMenuNode as PopupMenuNode<RadioGroupDef>,
              [...context.breadcrumbs, submenuBreadcrumb],
            )
          }

          // Handle items, checkbox items, submenus, and subpages
          if (
            childNode.kind !== 'item' &&
            childNode.kind !== 'checkbox-item' &&
            childNode.kind !== 'submenu' &&
            childNode.kind !== 'subpage'
          ) {
            return null
          }

          // Create context for child node (no deep search in submenu)
          const childContext: RowRenderContext = {
            search: null,
            breadcrumbs: [...context.breadcrumbs, submenuBreadcrumb],
            isDeepSearchResult: false,
            highlighted: false,
            disabled: childNode.disabled ?? false,
            group: null,
            tree: null,
          }

          // renderRowNode already wraps in a keyed Fragment
          return renderRowNode({
            kind: 'row',
            node: childMenuNode as PopupMenuNode<
              ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
            >,
            context: childContext,
          })
        }

        return (
          <React.Fragment key={id}>
            <GraftPointContext.Provider value={resolved}>
              {node.render({
                node: resolved,
                props: {
                  id,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  forceOrder: node.forceOrder,
                  forceScore: node.forceScore,
                },
                context: {
                  ...context,
                  value: node.value,
                  disabled: node.disabled ?? false,
                  async: submenuAsyncState,
                },
                nodes: staticChildren,
                asyncContent: node.asyncNodes,
                renderNode: submenuRenderNode,
              })}
            </GraftPointContext.Provider>
          </React.Fragment>
        )
      }

      if (node.kind === 'subpage') {
        const subpageAsyncState = getBranchAsyncState(node)
        const pageId = resolved.id

        return (
          <React.Fragment key={id}>
            {node.renderTrigger({
              node: resolved,
              props: {
                id,
                value: node.value,
                disabled: node.disabled ?? false,
                targetPageId: pageId,
              },
              context: {
                ...context,
                value: node.value,
                disabled: node.disabled ?? false,
                async: subpageAsyncState,
              },
            })}
          </React.Fragment>
        )
      }

      return null
    },
    [coordinator, normalizedSearch, isDeepSearching],
  )

  // Helper to render a radio group
  const renderRadioGroup = React.useCallback(
    (
      radioGroupNode: PopupMenuNode<RadioGroupDef>,
      breadcrumbs: BreadcrumbNode[] = [],
    ): React.ReactNode => {
      const radioGroup = radioGroupNode.def
      const isDeepSearchResult = breadcrumbs.length > 0

      // Build group context
      const groupContext: GroupRenderContext = {
        search: null,
        matchCount: radioGroup.nodes.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      // Render children - renderRowNode already wraps in keyed Fragment
      const childElements = radioGroupNode.children.map((item) => {
        if (!isRowMenuNode(item) || item.def.hidden) return null

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs,
          isDeepSearchResult,
          highlighted: false,
          disabled: item.def.disabled ?? false,
          group: null,
          tree: null,
        }

        return renderRowNode({
          kind: 'row',
          node: item,
          context: itemContext,
          radioGroup: { id: radioGroup.id, label: radioGroup.label },
        })
      })

      // Use custom render if provided
      if (radioGroup.render) {
        return (
          <React.Fragment key={radioGroup.id}>
            {radioGroup.render({
              node: radioGroupNode,
              props: {
                value: radioGroup.value,
                onValueChange: radioGroup.onValueChange,
                disabled: radioGroup.disabled ?? false,
              },
              context: {
                ...groupContext,
                label: radioGroup.label,
                value: radioGroup.value,
                disabled: radioGroup.disabled ?? false,
              },
              children: <>{childElements}</>,
            })}
          </React.Fragment>
        )
      }

      // Minimal default: just render children with a wrapper
      return (
        <div
          key={radioGroup.id}
          role="radiogroup"
          aria-label={radioGroup.label}
        >
          {renderGroupLabelElement(
            radioGroup.id,
            radioGroup.label,
            radioGroup.renderLabel,
            radioGroupNode,
            {
              ...groupContext,
              label: radioGroup.label,
              value: radioGroup.value,
              disabled: radioGroup.disabled ?? false,
            },
          )}
          {childElements}
        </div>
      )
    },
    [renderRowNode],
  )

  // Build the renderNode function that handles groups, radio groups, and rows
  const renderNode: RenderNodeFn = React.useCallback(
    (displayNode: DisplayNode): React.ReactNode => {
      // Handle group display nodes
      if (isDisplayGroupNode(displayNode)) {
        const groupNode = displayNode.node
        const { context, items } = displayNode
        const group = groupNode.def

        // Render children - renderRowNode already wraps in keyed Fragment
        const children = items.map((item) => renderRowNode(item))

        // Use custom render if provided
        if (group.render) {
          return (
            <React.Fragment key={group.id}>
              {group.render({
                node: groupNode,
                props: {},
                context: {
                  ...context,
                  label: group.label,
                },
                children: <>{children}</>,
              })}
            </React.Fragment>
          )
        }

        // Minimal default: just render children with a wrapper
        return (
          // biome-ignore lint/a11y/useSemanticElements: ignore for now
          <div key={group.id} role="group" aria-label={group.label}>
            {renderGroupLabelElement(
              group.id,
              group.label,
              group.renderLabel,
              groupNode,
              {
                ...context,
                label: group.label,
              },
            )}
            {children}
          </div>
        )
      }

      // Handle radio group display nodes
      if (isDisplayRadioGroupNode(displayNode)) {
        const radioGroupNode = displayNode.node
        const { context, items } = displayNode
        const radioGroup = radioGroupNode.def

        // Render children - renderRowNode already wraps in keyed Fragment
        const children = items.map((item) => renderRowNode(item))

        // Use custom render if provided
        if (radioGroup.render) {
          return (
            <React.Fragment key={radioGroup.id}>
              {radioGroup.render({
                node: radioGroupNode,
                props: {
                  value: radioGroup.value,
                  onValueChange: radioGroup.onValueChange,
                  disabled: radioGroup.disabled ?? false,
                },
                context: {
                  ...context,
                  label: radioGroup.label,
                  value: radioGroup.value,
                  disabled: radioGroup.disabled ?? false,
                },
                children: <>{children}</>,
              })}
            </React.Fragment>
          )
        }

        // Minimal default: just render children with a wrapper
        return (
          <div
            key={radioGroup.id}
            role="radiogroup"
            aria-label={radioGroup.label}
          >
            {renderGroupLabelElement(
              radioGroup.id,
              radioGroup.label,
              radioGroup.renderLabel,
              radioGroupNode,
              {
                ...context,
                label: radioGroup.label,
                value: radioGroup.value,
                disabled: radioGroup.disabled ?? false,
              },
            )}
            {children}
          </div>
        )
      }

      // Handle separator display nodes
      if (isDisplaySeparatorNode(displayNode)) {
        const separator = displayNode.node.def

        // Use custom render if provided
        if (separator.render) {
          return (
            <React.Fragment key={separator.id ?? 'separator'}>
              {separator.render({
                props: { id: separator.id },
              })}
            </React.Fragment>
          )
        }

        // Minimal default: render a div with role="none"
        return <div key={separator.id ?? 'separator'} role="none" />
      }

      // Handle row display nodes (items/checkbox items/submenus/subpages)
      // renderRowNode already wraps in keyed Fragment
      return renderRowNode(displayNode)
    },
    [renderRowNode],
  )

  // Get async state from coordinator
  const asyncState = React.useMemo(() => {
    if (!coordinator) {
      return {
        isLoading: false,
        isFetching: false,
        isInitialLoading: false,
        isRefetching: false,
        isAllRefetching: false,
        isStaticLoading: false,
        isStaticInitialLoading: false,
        isStaticRefetching: false,
        isQueryLoading: false,
        isQueryInitialLoading: false,
        isQueryRefetching: false,
        skippedMenus: [] as Array<{
          id: string
          reason: 'error'
        }>,
      }
    }
    return coordinator.getAsyncState()
  }, [coordinator, coordinator?.loaders, coordinator?.erroredLoaders])

  // Build children state
  const childrenState: DataListChildrenState = React.useMemo(
    () => ({
      search,
      nodes: displayNodes,
      renderNode,
      count: displayNodes.length,
      isDeepSearching,
      async: asyncState,
    }),
    [search, displayNodes, renderNode, isDeepSearching, asyncState],
  )

  // Use PopupMenuList which handles keyboard navigation
  return (
    <>
      {/* Render async loaders (hidden, just for hook execution) */}
      {shouldRenderAsyncLoaders && (
        <>
          {/* Root async content loader */}
          <RootAsyncLoader query={normalizedSearch} />

          {/* Submenu async loaders */}
          {asyncSubmenus.map((info) => (
            <AsyncLoaderRenderer
              key={info.id}
              info={info}
              query={normalizedSearch}
              enabled={isDeepSearchActive}
            />
          ))}
        </>
      )}

      <DataListContext.Provider value={childrenState}>
        <PopupMenuListPrimitive
          ref={forwardedRef}
          label={label}
          {...listProps}
          // Re-measure rows when deep-search mode toggles — the same Resolved IDs
          // render different content (label vs breadcrumb row). Consumer deps
          // are merged in rather than replaced.
          remeasureDependencies={[
            isDeepSearching,
            ...(remeasureDependencies ?? []),
          ]}
        >
          {children}
        </PopupMenuListPrimitive>
      </DataListContext.Provider>
    </>
  )
})
