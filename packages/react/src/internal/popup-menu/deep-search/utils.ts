import { commandScore } from '../../listbox/utils/command-score.js'
import { normalizeValue, slugify } from '../../listbox/utils/normalize.js'
import {
  defaultGetResolvedId,
  resolveDetachedNode,
} from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import type {
  AsyncNodesConfig,
  BreadcrumbNode,
  CheckboxItemDef,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  IncludeInDeepSearch,
  ItemDef,
  NodeDef,
  RadioGroupBehavior,
  RadioGroupDef,
  RadioItemDef,
  RowRenderContext,
  ScoredNode,
  SubmenuDef,
  SubpageDef,
  TreeItemDef,
} from './types.js'

const identityQuery = (query: string) => query

// ============================================================================
/**
 * Computes a row's canonical definition-tree path (`definitionPath`): the display
 * path of the computing surface, then breadcrumb components, then the node's
 * own Definition Key (`id`, or its slugified `value`), root-first. Empty keys
 * are skipped. Identical wherever the row renders — browse, deep search,
 * or recursion.
 */
export function computeDefPath(
  displayPath: string[],
  breadcrumbs: BreadcrumbNode[],
  id: string | undefined,
  value: string,
): string[] {
  return [
    ...displayPath,
    ...breadcrumbs.map((b) => b.id ?? slugify(b.value)),
    id ?? slugify(value),
  ].filter(Boolean)
}

/**
 * Computes a deterministic page ID for a subpage node.
 *
 * Priority:
 * - explicit `node.pageId`
 * - derived from breadcrumb and node segments following the canonical rule:
 *   explicit `id` verbatim, otherwise slugified `value`
 */
export function getSubpagePageId(
  node: SubpageDef,
  breadcrumbs: BreadcrumbNode[],
): string {
  if (node.pageId) {
    return node.pageId
  }

  const breadcrumbSegments = breadcrumbs
    .map((breadcrumb) => breadcrumb.id ?? slugify(breadcrumb.value))
    .filter(Boolean)
  const leafSegment = node.id ?? slugify(node.value)
  const path = [...breadcrumbSegments, leafSegment].filter(Boolean).join('.')

  return path ? `subpage.${path}` : 'subpage'
}

/**
 * Path key for a branch's async loader. **Value-only by design** — breadcrumb
 * and leaf `value`s, normalized and dot-joined; explicit `id`s are deliberately
 * ignored. Must stay consistent with the key computations inside
 * `collectAsyncSubmenus` and `mergeAsyncNodesIntoTree`.
 */
export function getAsyncLoaderIdForBranch(
  node: SubmenuDef | SubpageDef,
  breadcrumbs: BreadcrumbNode[],
): string {
  return [
    ...breadcrumbs.map((breadcrumb) => normalizeValue(breadcrumb.value)),
    normalizeValue(node.value),
  ].join('.')
}

// ============================================================================
// Type Guards
// ============================================================================

export function isItemDef(node: NodeDef): node is ItemDef {
  return node.kind === 'item'
}

export function isRadioItemDef(node: NodeDef): node is RadioItemDef {
  return node.kind === 'radio-item'
}

export function isCheckboxItemDef(node: NodeDef): node is CheckboxItemDef {
  return node.kind === 'checkbox-item'
}

export function isTreeItemDef(node: NodeDef): node is TreeItemDef {
  return node.kind === 'tree-item'
}

export function isSubmenuDef(node: NodeDef): node is SubmenuDef {
  return node.kind === 'submenu'
}

export function isSubpageDef(node: NodeDef): node is SubpageDef {
  return node.kind === 'subpage'
}

export function isGroupDef(node: NodeDef): node is GroupDef {
  return node.kind === 'group'
}

export function isRadioGroupDef(node: NodeDef): node is RadioGroupDef {
  return node.kind === 'radio-group'
}

export function isSeparatorDef(
  node: NodeDef,
): node is { kind: 'separator'; id?: string } {
  return node.kind === 'separator'
}

// ============================================================================
// Flatten Nodes for Search
// ============================================================================

interface FlattenOptions {
  /** Whether to include children of branch nodes (submenu/subpage) */
  deep?: boolean
  /** Default include mode for descendant branch nodes */
  includeInDeepSearch?: IncludeInDeepSearch
  /** Whether ancestors allow this subtree to participate in deep search */
  descendantsIncluded?: boolean
  /** Parent breadcrumb nodes (branch nodes from root to parent) */
  breadcrumbs?: BreadcrumbNode[]
  /** Current group context (nested groups not supported) */
  group?: { id: string; label?: string; groupDef: GroupDef } | null
  /** Current radio group context */
  radioGroup?: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
  } | null
  /** Keywords inherited from tree ancestors. */
  inheritedKeywords?: string[]
}

interface FlattenedNode {
  node:
    | ItemDef
    | RadioItemDef
    | CheckboxItemDef
    | SubmenuDef
    | SubpageDef
    | TreeItemDef
  /** Breadcrumb nodes (branch nodes from root to parent) */
  breadcrumbs: BreadcrumbNode[]
  /** The group this node belongs to, if any */
  group: { id: string; label?: string; groupDef: GroupDef } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
  } | null
  /** Keywords inherited from tree ancestors. */
  inheritedKeywords: string[]
}

/** Returns the child kinds supported by v1 inline trees. */
export function getSupportedTreeChildren(
  nodes: NodeDef[],
): Array<TreeItemDef | ItemDef | SubmenuDef> {
  const supported: Array<TreeItemDef | ItemDef | SubmenuDef> = []
  for (const node of nodes) {
    if (
      node.kind === 'tree-item' ||
      node.kind === 'item' ||
      node.kind === 'submenu'
    ) {
      supported.push(node)
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`Unsupported ${node.kind} child skipped inside tree-item.`)
    }
  }
  return supported
}

/**
 * Flattens a tree of node definitions into a flat array.
 * When deep=true, includes children of branch nodes with their breadcrumb paths.
 * Tracks group and radio group membership for each node.
 */
export function flattenNodes(
  nodes: NodeDef[],
  options: FlattenOptions = {},
): FlattenedNode[] {
  const {
    deep = false,
    includeInDeepSearch = true,
    descendantsIncluded = true,
    breadcrumbs = [],
    group = null,
    radioGroup = null,
    inheritedKeywords = [],
  } = options
  const result: FlattenedNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Skip separators during search
      continue
    }

    if (node.kind === 'group') {
      // Groups are containers - recurse into their children with group context
      // Note: Nested groups are not supported, so we pass this group directly
      const groupInfo = { id: node.id, label: node.label, groupDef: node }
      result.push(
        ...flattenNodes(node.nodes, {
          deep,
          includeInDeepSearch,
          descendantsIncluded,
          breadcrumbs,
          group: groupInfo,
          radioGroup: null, // Reset radio group when entering a regular group
          inheritedKeywords,
        }),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      // Radio groups are containers - recurse into their children with radio group context
      if (node.hidden) continue

      const radioGroupInfo = {
        id: node.id,
        label: node.label,
        radioGroupDef: node,
      }
      result.push(
        ...flattenNodes(node.nodes, {
          deep,
          includeInDeepSearch,
          descendantsIncluded,
          breadcrumbs,
          group: null, // Reset regular group when entering a radio group
          radioGroup: radioGroupInfo,
          inheritedKeywords,
        }),
      )
      continue
    }

    if (node.hidden) {
      continue
    }

    if (
      node.kind === 'item' ||
      node.kind === 'radio-item' ||
      node.kind === 'checkbox-item'
    ) {
      result.push({
        node,
        breadcrumbs,
        group,
        radioGroup,
        inheritedKeywords,
      })
      continue
    }

    if (node.kind === 'tree-item') {
      if (node.selectable !== false) {
        result.push({ node, breadcrumbs, group, radioGroup, inheritedKeywords })
      }

      if (node.nodes?.length && node.deepSearch !== false) {
        const treeBreadcrumb: BreadcrumbNode = {
          node,
          value: node.value,
          id: node.id,
        }
        result.push(
          ...flattenNodes(getSupportedTreeChildren(node.nodes), {
            deep,
            includeInDeepSearch,
            descendantsIncluded,
            breadcrumbs: [...breadcrumbs, treeBreadcrumb],
            group,
            radioGroup,
            inheritedKeywords: [...inheritedKeywords, node.value],
          }),
        )
      }
      continue
    }

    if (node.kind === 'submenu' || node.kind === 'subpage') {
      const branchIncludeMode = node.includeInDeepSearch ?? includeInDeepSearch

      // includeInDeepSearch only affects deep search results.
      // In shallow mode, branch triggers remain searchable as normal rows.
      const shouldIncludeBranchTrigger =
        !deep || (descendantsIncluded && branchIncludeMode !== false)

      if (shouldIncludeBranchTrigger) {
        result.push({
          node,
          breadcrumbs,
          group,
          radioGroup,
          inheritedKeywords,
        })
      }

      // If deep search enabled and branch allows descendants, include children.
      const shouldIncludeBranchDescendants =
        deep &&
        descendantsIncluded &&
        branchIncludeMode === true &&
        node.deepSearch !== false

      if (shouldIncludeBranchDescendants && node.nodes) {
        const branchBreadcrumb: BreadcrumbNode = {
          node,
          value: node.value,
          id: node.id,
        }
        const childBreadcrumbs: BreadcrumbNode[] = [
          ...breadcrumbs,
          branchBreadcrumb,
        ]

        result.push(
          ...flattenNodes(
            node.nodes.filter((child) => {
              if (child.kind === 'tree-item') {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn(
                    'Unsupported tree-item child skipped inside submenu/subpage.',
                  )
                }
                return false
              }
              return true
            }),
            {
              deep,
              includeInDeepSearch,
              descendantsIncluded: true,
              breadcrumbs: childBreadcrumbs,
              // Reset group and radio group context when entering a branch node
              group: null,
              radioGroup: null,
              inheritedKeywords,
            },
          ),
        )
      }
    }
  }

  return result
}

// ============================================================================
// Score Nodes
// ============================================================================

/**
 * Scores nodes against a search query.
 * Returns only nodes with a score > 0.
 */
export function scoreNodes(
  flattenedNodes: FlattenedNode[],
  query: string,
  normalizeQuery: (query: string) => string = normalizeValue,
): ScoredNode[] {
  const normalizedQuery = normalizeQuery(query)

  if (!normalizedQuery) {
    // No query - return all nodes with score 1
    return flattenedNodes.map(
      ({ node, breadcrumbs, group, radioGroup }): ScoredNode => ({
        node,
        score: 1,
        breadcrumbs,
        group,
        radioGroup,
      }),
    )
  }

  const results: ScoredNode[] = []

  for (const {
    node,
    breadcrumbs,
    group,
    radioGroup,
    inheritedKeywords,
  } of flattenedNodes) {
    // Normalize value and keywords to match cmdk's behavior
    const normalizedValue = normalizeValue(node.value)
    const normalizedKeywords = [...(node.keywords ?? []), ...inheritedKeywords]
      .map((k) => normalizeValue(k))
      .filter(Boolean)

    const fuzzyScore = commandScore(
      normalizedValue,
      normalizedQuery,
      normalizedKeywords.length > 0 ? normalizedKeywords : undefined,
    )
    const score = node.forceScore ?? fuzzyScore

    if (score > 0) {
      results.push({
        node,
        score,
        breadcrumbs,
        group,
        radioGroup,
      })
    }
  }

  return results
}

// ============================================================================
// Sort Nodes
// ============================================================================

function getNodeForceOrder(node: { forceOrder?: number }): number {
  return node.forceOrder ?? 0
}

function compareScoredNodesByForceOrderAndScore(
  a: ScoredNode,
  b: ScoredNode,
): number {
  const orderDiff = getNodeForceOrder(a.node) - getNodeForceOrder(b.node)
  if (orderDiff !== 0) {
    return orderDiff
  }

  return b.score - a.score
}

function getRowKindSortRank(
  kind:
    | 'item'
    | 'radio-item'
    | 'checkbox-item'
    | 'tree-item'
    | 'submenu'
    | 'subpage',
): number {
  return kind === 'submenu' || kind === 'subpage' ? 1 : 0
}

function sortByForceOrderThenKindThenScore(
  a: { forceOrder: number; kindRank: number; score: number },
  b: { forceOrder: number; kindRank: number; score: number },
): number {
  const orderDiff = a.forceOrder - b.forceOrder
  if (orderDiff !== 0) {
    return orderDiff
  }

  const kindDiff = a.kindRank - b.kindRank
  if (kindDiff !== 0) {
    return kindDiff
  }

  return b.score - a.score
}

function getMinForceOrderFromDisplayRows(nodes: DisplayRowNode[]): number {
  if (nodes.length === 0) {
    return 0
  }

  let minForceOrder = Number.POSITIVE_INFINITY

  for (const item of nodes) {
    const forceOrder = getNodeForceOrder(item.node.def)
    if (forceOrder < minForceOrder) {
      minForceOrder = forceOrder
    }
  }

  return minForceOrder === Number.POSITIVE_INFINITY ? 0 : minForceOrder
}

/**
 * Sorts scored nodes by forced order, then score (descending).
 */
export function sortByScore(nodes: ScoredNode[]): ScoredNode[] {
  return [...nodes].sort(compareScoredNodesByForceOrderAndScore)
}

/**
 * Partitions nodes by forced order bucket, then kind.
 * Within each forceOrder bucket, items are shown before submenu/subpage triggers.
 */
export function partitionByKind(nodes: ScoredNode[]): ScoredNode[] {
  const byForceOrder = new Map<
    number,
    {
      items: ScoredNode[]
      branches: ScoredNode[]
    }
  >()

  for (const node of nodes) {
    const forceOrder = getNodeForceOrder(node.node)
    const bucket = byForceOrder.get(forceOrder) ?? {
      items: [],
      branches: [],
    }

    if (
      node.node.kind === 'item' ||
      node.node.kind === 'radio-item' ||
      node.node.kind === 'checkbox-item' ||
      node.node.kind === 'tree-item'
    ) {
      bucket.items.push(node)
    } else {
      bucket.branches.push(node)
    }

    byForceOrder.set(forceOrder, bucket)
  }

  const sortedForceOrders = [...byForceOrder.keys()].sort((a, b) => a - b)

  const result: ScoredNode[] = []

  for (const forceOrder of sortedForceOrders) {
    const bucket = byForceOrder.get(forceOrder)
    if (!bucket) {
      continue
    }

    result.push(...bucket.items, ...bucket.branches)
  }

  return result
}

/**
 * Deduplicates nodes by their composite ID (breadcrumb segments + node ID/value).
 * This handles the case where the same node appears multiple times in the tree.
 * Values are normalized (trimmed) for consistent deduplication.
 */
export function deduplicateNodes(nodes: ScoredNode[]): ScoredNode[] {
  const seen = new Set<string>()
  const result: ScoredNode[] = []

  for (const scoredNode of nodes) {
    const compositeId = [
      ...scoredNode.breadcrumbs.map(
        (breadcrumb) => breadcrumb.id ?? normalizeValue(breadcrumb.value),
      ),
      scoredNode.node.id ?? normalizeValue(scoredNode.node.value),
    ].join('.')
    if (!seen.has(compositeId)) {
      seen.add(compositeId)
      result.push(scoredNode)
    }
  }

  return result
}

// ============================================================================
// Build Display Nodes
// ============================================================================

/**
 * Converts scored nodes to display row nodes with render context.
 * Used for flatten mode where groups are invisible.
 */
export function buildDisplayRowNodes(
  scoredNodes: ScoredNode[],
  query: string,
  highlightedId: string | null,
  getNodeForDef: <D extends NodeDef>(
    def: D,
  ) => PopupMenuNode<D> = resolveDetachedNodeForDef,
): DisplayRowNode[] {
  return scoredNodes.map((scoredNode) => {
    const isDeepSearchResult = scoredNode.breadcrumbs.length > 0

    const context: RowRenderContext = {
      search: query
        ? {
            query,
            score: scoredNode.score,
          }
        : null,
      breadcrumbs: scoredNode.breadcrumbs,
      // breadcrumbs already set above
      isDeepSearchResult,
      highlighted: scoredNode.node.id === highlightedId,
      disabled: scoredNode.node.disabled ?? false,
      group: scoredNode.group
        ? { id: scoredNode.group.id, label: scoredNode.group.label }
        : null,
      tree: null,
    }

    return {
      kind: 'row',
      node: getNodeForDef(scoredNode.node),
      context,
      radioGroup: scoredNode.radioGroup
        ? { id: scoredNode.radioGroup.id, label: scoredNode.radioGroup.label }
        : undefined,
    }
  })
}

/**
 * Builds a single DisplayRowNode from a ScoredNode.
 * Helper function for building row nodes.
 */
function buildDisplayRowNode(
  scoredNode: ScoredNode,
  query: string,
  highlightedId: string | null,
  getNodeForDef: <D extends NodeDef>(
    def: D,
  ) => PopupMenuNode<D> = resolveDetachedNodeForDef,
): DisplayRowNode {
  const isDeepSearchResult = scoredNode.breadcrumbs.length > 0

  const context: RowRenderContext = {
    search: query
      ? {
          query,
          score: scoredNode.score,
        }
      : null,
    breadcrumbs: scoredNode.breadcrumbs,
    isDeepSearchResult,
    highlighted: scoredNode.node.id === highlightedId,
    disabled: scoredNode.node.disabled ?? false,
    group: scoredNode.group
      ? { id: scoredNode.group.id, label: scoredNode.group.label }
      : null,
    tree: null,
  }

  return {
    kind: 'row',
    node: getNodeForDef(scoredNode.node),
    context,
    radioGroup: scoredNode.radioGroup
      ? { id: scoredNode.radioGroup.id, label: scoredNode.radioGroup.label }
      : undefined,
  }
}

// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

/**
 * Gets nodes for browse mode (no search) with flatten behavior.
 * Returns only top-level items and submenu triggers, flattening groups.
 */
export function getBrowseNodesFlatten(
  nodes: NodeDef[],
  highlightedId: string | null,
  group: { id: string; label?: string } | null = null,
  getNodeForDef: <D extends NodeDef>(
    def: D,
  ) => PopupMenuNode<D> = resolveDetachedNodeForDef,
): DisplayRowNode[] {
  const result: DisplayRowNode[] = []
  const visibleRowNodes = nodes.filter(
    (node) =>
      node.kind !== 'separator' &&
      node.kind !== 'group' &&
      node.kind !== 'radio-group' &&
      !node.hidden,
  )

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Skip separators - they're not focusable
      continue
    }

    if (node.kind === 'group') {
      // Recurse into groups, passing group context
      const groupInfo = { id: node.id, label: node.label }
      result.push(
        ...getBrowseNodesFlatten(
          node.nodes,
          highlightedId,
          groupInfo,
          getNodeForDef,
        ),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      // Radio groups should not be flattened - skip in flatten mode
      // They will be handled by getBrowseNodesPreserve
      continue
    }

    if (node.hidden) {
      continue
    }

    if (node.kind === 'tree-item') {
      result.push(
        ...expandTreeNode(
          node,
          highlightedId,
          group,
          0,
          [],
          [],
          node === visibleRowNodes.at(-1),
          getNodeForDef,
        ),
      )
      continue
    }

    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.id === highlightedId,
      disabled: node.disabled ?? false,
      group,
      tree: null,
    }

    result.push({ kind: 'row', node: getNodeForDef(node), context })
  }

  return result
}

function expandTreeNode(
  node: TreeItemDef,
  highlightedId: string | null,
  group: { id: string; label?: string } | null,
  depth: number,
  ancestorsLast: boolean[],
  breadcrumbs: BreadcrumbNode[],
  isLastChild: boolean,
  getNodeForDef: <D extends NodeDef>(def: D) => PopupMenuNode<D>,
): DisplayRowNode[] {
  const supportedChildren = getSupportedTreeChildren(node.nodes ?? []).filter(
    (child) => !child.hidden,
  )
  const tree = {
    depth,
    hasChildren: supportedChildren.length > 0,
    isLastChild,
    ancestorsLast,
    header: node.selectable === false,
  }
  const rows: DisplayRowNode[] = [
    {
      kind: 'row',
      node: getNodeForDef(node),
      context: {
        search: null,
        breadcrumbs,
        isDeepSearchResult: false,
        highlighted: node.id === highlightedId,
        disabled: node.disabled ?? false,
        group,
        tree,
      },
    },
  ]

  const childBreadcrumb: BreadcrumbNode = {
    node,
    value: node.value,
    id: node.id,
  }
  const childBreadcrumbs = [...breadcrumbs, childBreadcrumb]
  supportedChildren.forEach((child, index) => {
    const childIsLast = index === supportedChildren.length - 1
    if (child.kind === 'tree-item') {
      rows.push(
        ...expandTreeNode(
          child,
          highlightedId,
          group,
          depth + 1,
          [...ancestorsLast, isLastChild],
          childBreadcrumbs,
          childIsLast,
          getNodeForDef,
        ),
      )
      return
    }

    rows.push({
      kind: 'row',
      node: getNodeForDef(child),
      context: {
        search: null,
        breadcrumbs: childBreadcrumbs,
        isDeepSearchResult: false,
        highlighted: child.id === highlightedId,
        disabled: child.disabled ?? false,
        group,
        tree: {
          depth: depth + 1,
          hasChildren:
            child.kind === 'submenu' && (child.nodes?.length ?? 0) > 0,
          isLastChild: childIsLast,
          ancestorsLast: [...ancestorsLast, isLastChild],
          header: false,
        },
      },
    })
  })
  return rows
}

/**
 * Gets nodes for browse mode (no search) with preserve behavior.
 * Keeps group structure intact, showing group containers with their items.
 */
/**
 * Fallback node resolution for callers without a menu-tree resolver (tests and
 * standalone use of the filter helpers). Detached nodes are cached per def, so
 * this stays referentially stable across calls.
 */
export function resolveDetachedNodeForDef<D extends NodeDef>(
  def: D,
): PopupMenuNode<D> {
  return resolveDetachedNode(def, defaultGetResolvedId)
}

export function getBrowseNodesPreserve(
  nodes: NodeDef[],
  highlightedId: string | null,
  getNodeForDef: <D extends NodeDef>(
    def: D,
  ) => PopupMenuNode<D> = resolveDetachedNodeForDef,
): DisplayNode[] {
  const result: DisplayNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Include separators in browse mode for visual separation
      result.push({ kind: 'separator', node: getNodeForDef(node) })
      continue
    }

    if (node.kind === 'group') {
      // Build group items
      const groupItems: DisplayRowNode[] = []
      const visibleGroupChildren = node.nodes.filter(
        (child) =>
          child.kind !== 'separator' &&
          child.kind !== 'group' &&
          child.kind !== 'radio-group' &&
          !child.hidden,
      )
      for (const child of node.nodes) {
        // Skip non-row nodes
        if (
          child.kind === 'separator' ||
          child.kind === 'group' ||
          child.kind === 'radio-group'
        ) {
          continue
        }
        if (child.hidden) continue

        if (child.kind === 'tree-item') {
          groupItems.push(
            ...expandTreeNode(
              child,
              highlightedId,
              { id: node.id, label: node.label },
              0,
              [],
              [],
              child === visibleGroupChildren.at(-1),
              getNodeForDef,
            ),
          )
          continue
        }

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.id === highlightedId,
          disabled: child.disabled ?? false,
          group: { id: node.id, label: node.label },
          tree: null,
        }

        groupItems.push({
          kind: 'row',
          node: getNodeForDef(child),
          context: itemContext,
        })
      }

      // Only include group if it has items
      if (groupItems.length > 0) {
        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: groupItems.length,
          breadcrumbs: [],
          isDeepSearchResult: false,
        }

        result.push({
          kind: 'group',
          node: getNodeForDef(node),
          context: groupContext,
          items: groupItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (node.kind === 'radio-group') {
      if (node.hidden) continue

      // Build radio group items
      const radioItems: DisplayRowNode[] = []
      for (const child of node.nodes) {
        // RadioGroupDef.nodes only contains ItemDef | SubmenuDef | CheckboxItemDef
        if (child.hidden) continue

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.id === highlightedId,
          disabled: child.disabled ?? false,
          group: null, // Radio items don't belong to a regular group
          tree: null,
        }

        radioItems.push({
          kind: 'row',
          node: getNodeForDef(child),
          context: itemContext,
          radioGroup: { id: node.id, label: node.label },
        })
      }

      // Only include radio group if it has items
      if (radioItems.length > 0) {
        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: radioItems.length,
          breadcrumbs: [],
          isDeepSearchResult: false,
        }

        result.push({
          kind: 'radio-group',
          node: getNodeForDef(node),
          context: groupContext,
          items: radioItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (node.hidden) {
      continue
    }

    // Ungrouped item/submenu/subpage
    if (node.kind === 'tree-item') {
      const visibleRowNodes = nodes.filter(
        (sibling) =>
          sibling.kind !== 'separator' &&
          sibling.kind !== 'group' &&
          sibling.kind !== 'radio-group' &&
          !sibling.hidden,
      )
      result.push(
        ...expandTreeNode(
          node,
          highlightedId,
          null,
          0,
          [],
          [],
          node === visibleRowNodes.at(-1),
          getNodeForDef,
        ),
      )
      continue
    }

    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.id === highlightedId,
      disabled: node.disabled ?? false,
      group: null,
      tree: null,
    }
    result.push({ kind: 'row', node: getNodeForDef(node), context })
  }

  return result
}

// ============================================================================
// Full Pipeline
// ============================================================================

export interface FilterNodesOptions {
  /** The search query */
  query: string
  /** Optional query normalizer. Defaults to trimming whitespace. */
  normalizeQuery?: (query: string) => string
  /** The node definitions to filter */
  nodes: NodeDef[]
  /** Currently highlighted node ID */
  highlightedId: string | null
  /** Whether deep search is enabled */
  deepSearch?: boolean
  /** Default include mode for descendant submenus during deep search */
  includeInDeepSearch?: IncludeInDeepSearch
  /** Minimum query length for deep search */
  minLength?: number
  /** How groups behave during search (only applies when searching, not browse mode) */
  groupSearchBehavior?: GroupBehavior
  /** How radio groups behave during search */
  radioGroupSearchBehavior?: RadioGroupBehavior
  /** Whether to sort groups by best score */
  sortGroups?: boolean
  /**
   * Resolves a def to its resolver-owned node, used to populate
   * `node` on group display nodes. Defaults to detached resolution for callers
   * without a menu-tree resolver.
   */
  getNodeForDef?: <D extends NodeDef>(def: D) => PopupMenuNode<D>
}

/**
 * Filters nodes with 'flatten' group behavior.
 * Groups are invisible, items shown in flat list.
 * Radio group behavior is controlled by radioGroupSearchBehavior.
 */
function filterNodesFlatten(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    normalizeQuery,
    nodes,
    highlightedId,
    deepSearch = true,
    includeInDeepSearch = true,
    minLength = 0,
    radioGroupSearchBehavior = 'preserve',
    getNodeForDef = resolveDetachedNodeForDef,
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
  })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  // Maps radio group ID -> all flattened nodes for that group
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: FlattenedNode[]
      breadcrumbs: BreadcrumbNode[]
    }
  >()

  if (radioGroupSearchBehavior === 'preserve-show-all') {
    for (const flatNode of flattened) {
      if (flatNode.radioGroup) {
        const existing = allRadioGroupItems.get(flatNode.radioGroup.id)
        if (existing) {
          existing.items.push(flatNode)
        } else {
          allRadioGroupItems.set(flatNode.radioGroup.id, {
            radioGroupDef: flatNode.radioGroup.radioGroupDef,
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // Score nodes
  const scored = scoreNodes(flattened, query, normalizeQuery)

  // Separate radio group items from regular items
  const radioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: ScoredNode[]
      breadcrumbs: BreadcrumbNode[]
    }
  >()
  const regularItems: ScoredNode[] = []

  for (const scoredNode of scored) {
    if (scoredNode.radioGroup) {
      // For 'flatten' behavior, treat radio items as regular items
      if (radioGroupSearchBehavior === 'flatten') {
        regularItems.push(scoredNode)
      } else {
        // For 'preserve' and 'preserve-show-all', group them
        const existing = radioGroupItems.get(scoredNode.radioGroup.id)
        if (existing) {
          existing.items.push(scoredNode)
        } else {
          radioGroupItems.set(scoredNode.radioGroup.id, {
            radioGroupDef: scoredNode.radioGroup.radioGroupDef,
            items: [scoredNode],
            breadcrumbs: scoredNode.breadcrumbs,
          })
        }
      }
    } else {
      regularItems.push(scoredNode)
    }
  }

  // Sort regular items by score
  const sorted = sortByScore(regularItems)

  // Partition (items first, then submenus)
  const partitioned = partitionByKind(sorted)

  // Deduplicate
  const unique = deduplicateNodes(partitioned)

  // Build display nodes for regular items
  const regularDisplayNodes: DisplayRowNode[] = buildDisplayRowNodes(
    unique,
    query,
    highlightedId,
    getNodeForDef,
  )

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: DisplayRadioGroupNode[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { radioGroupDef, items: matchingItems, breadcrumbs },
    ] of radioGroupItems) {
      let itemsToDisplay: ScoredNode[]

      if (radioGroupSearchBehavior === 'preserve-show-all') {
        // Include ALL items from this radio group, not just matching ones
        const allItems = allRadioGroupItems.get(radioGroupId)
        if (allItems) {
          // Create scored nodes for all items, using 0 for non-matching
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )

          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        // 'preserve' - only show matching items
        itemsToDisplay = matchingItems
      }

      // Sort items by forced order, then score.
      itemsToDisplay.sort(compareScoredNodesByForceOrderAndScore)

      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const isDeepSearchResult = breadcrumbs.length > 0

      const groupContext: GroupRenderContext = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      radioGroupDisplayNodes.push({
        kind: 'radio-group',
        node: getNodeForDef(radioGroupDef),
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId, getNodeForDef),
        ),
        bestScore,
      })
    }
  }

  // Merge regular items and radio groups, sorted by forced order then score.
  type SortableNode = {
    node: DisplayNode
    score: number
    forceOrder: number
    kindRank: number
  }

  const allNodes: SortableNode[] = [
    ...regularDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.context.search?.score ?? 0,
      forceOrder: getNodeForceOrder(r.node.def),
      kindRank: getRowKindSortRank(r.node.kind),
    })),
    ...radioGroupDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(r.items),
      kindRank: 0,
    })),
  ]

  allNodes.sort(sortByForceOrderThenKindThenScore)

  return {
    displayNodes: allNodes.map((n) => n.node),
    isDeepSearching: shouldDeepSearch,
  }
}

/**
 * Filters nodes with 'preserve' group behavior.
 * Groups are shown as containers with their matching items.
 * Groups and ungrouped items are mixed by score.
 * Radio group behavior is controlled by radioGroupSearchBehavior.
 */
function filterNodesPreserve(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    normalizeQuery,
    nodes,
    highlightedId,
    deepSearch = true,
    includeInDeepSearch = true,
    minLength = 0,
    sortGroups = true,
    radioGroupSearchBehavior = 'preserve',
    getNodeForDef = resolveDetachedNodeForDef,
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes (tracking group and radio group membership)
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
  })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: FlattenedNode[]
      breadcrumbs: BreadcrumbNode[]
    }
  >()

  if (radioGroupSearchBehavior === 'preserve-show-all') {
    for (const flatNode of flattened) {
      if (flatNode.radioGroup) {
        const existing = allRadioGroupItems.get(flatNode.radioGroup.id)
        if (existing) {
          existing.items.push(flatNode)
        } else {
          allRadioGroupItems.set(flatNode.radioGroup.id, {
            radioGroupDef: flatNode.radioGroup.radioGroupDef,
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // Score nodes
  const scored = scoreNodes(flattened, query, normalizeQuery)

  // Partition into groups, radio groups, and ungrouped
  const groupedItems = new Map<
    string,
    { groupDef: GroupDef; items: ScoredNode[]; breadcrumbs: BreadcrumbNode[] }
  >()
  const radioGroupedItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: ScoredNode[]
      breadcrumbs: BreadcrumbNode[]
    }
  >()
  const ungroupedItems: ScoredNode[] = []

  for (const scoredNode of scored) {
    if (scoredNode.radioGroup) {
      // For 'flatten' behavior, treat radio items as ungrouped
      if (radioGroupSearchBehavior === 'flatten') {
        ungroupedItems.push(scoredNode)
      } else {
        const existing = radioGroupedItems.get(scoredNode.radioGroup.id)
        if (existing) {
          existing.items.push(scoredNode)
        } else {
          radioGroupedItems.set(scoredNode.radioGroup.id, {
            radioGroupDef: scoredNode.radioGroup.radioGroupDef,
            items: [scoredNode],
            breadcrumbs: scoredNode.breadcrumbs,
          })
        }
      }
    } else if (scoredNode.group) {
      const existing = groupedItems.get(scoredNode.group.id)
      if (existing) {
        existing.items.push(scoredNode)
      } else {
        groupedItems.set(scoredNode.group.id, {
          groupDef: scoredNode.group.groupDef,
          items: [scoredNode],
          breadcrumbs: scoredNode.breadcrumbs,
        })
      }
    } else {
      ungroupedItems.push(scoredNode)
    }
  }

  // Build display nodes for groups (with items sorted by score)
  const groupDisplayNodes: DisplayGroupNode[] = []
  for (const [_groupId, { groupDef, items, breadcrumbs }] of groupedItems) {
    // Sort items within group by forced order, then score.
    items.sort(compareScoredNodesByForceOrderAndScore)

    const bestScore = Math.max(...items.map((item) => item.score), 0)
    const isDeepSearchResult = breadcrumbs.length > 0

    const groupContext: GroupRenderContext = {
      search: query ? { query, bestScore } : null,
      matchCount: items.length,
      breadcrumbs,
      isDeepSearchResult,
    }

    groupDisplayNodes.push({
      kind: 'group',
      node: getNodeForDef(groupDef),
      context: groupContext,
      items: items.map((item) =>
        buildDisplayRowNode(item, query, highlightedId, getNodeForDef),
      ),
      bestScore,
    })
  }

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: DisplayRadioGroupNode[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { radioGroupDef, items: matchingItems, breadcrumbs },
    ] of radioGroupedItems) {
      let itemsToDisplay: ScoredNode[]

      if (radioGroupSearchBehavior === 'preserve-show-all') {
        // Include ALL items from this radio group, not just matching ones
        const allItems = allRadioGroupItems.get(radioGroupId)
        if (allItems) {
          // Create scored nodes for all items, using 0 for non-matching
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )

          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        // 'preserve' - only show matching items
        itemsToDisplay = matchingItems
      }

      // Sort items by forced order, then score.
      itemsToDisplay.sort(compareScoredNodesByForceOrderAndScore)

      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const isDeepSearchResult = breadcrumbs.length > 0

      const groupContext: GroupRenderContext = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      radioGroupDisplayNodes.push({
        kind: 'radio-group',
        node: getNodeForDef(radioGroupDef),
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId, getNodeForDef),
        ),
        bestScore,
      })
    }
  }

  // Build display nodes for ungrouped items
  const ungroupedDisplayNodes: DisplayRowNode[] = ungroupedItems
    .sort(compareScoredNodesByForceOrderAndScore)
    .map((item) =>
      buildDisplayRowNode(item, query, highlightedId, getNodeForDef),
    )

  // Merge groups, radio groups, and ungrouped items, sorted by forced order then score.
  type SortableNode = {
    node: DisplayNode
    score: number
    forceOrder: number
    kindRank: number
  }

  const allNodes: SortableNode[] = [
    ...groupDisplayNodes.map((g) => ({
      node: g as DisplayNode,
      score: g.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(g.items),
      kindRank: 0,
    })),
    ...radioGroupDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(r.items),
      kindRank: 0,
    })),
    ...ungroupedDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.context.search?.score ?? 0,
      forceOrder: getNodeForceOrder(r.node.def),
      kindRank: getRowKindSortRank(r.node.kind),
    })),
  ]

  if (sortGroups) {
    allNodes.sort(sortByForceOrderThenKindThenScore)
  }

  return {
    displayNodes: allNodes.map((n) => n.node),
    isDeepSearching: shouldDeepSearch,
  }
}

/**
 * Main filtering pipeline.
 * Handles both browse mode and search mode (shallow and deep).
 * Respects groupSearchBehavior configuration (only applies during search).
 * Note: Radio groups are ALWAYS preserved regardless of groupSearchBehavior.
 */
export function filterNodes(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    nodes,
    highlightedId,
    groupSearchBehavior = 'preserve',
    getNodeForDef = resolveDetachedNodeForDef,
  } = options
  const normalizeQuery = options.normalizeQuery ?? normalizeValue
  const normalizedQuery = normalizeQuery(query)
  const normalizedOptions =
    normalizedQuery === query
      ? { ...options, normalizeQuery: identityQuery }
      : {
          ...options,
          query: normalizedQuery,
          normalizeQuery: identityQuery,
        }

  // Browse mode - no query
  // Always preserve groups in browse mode (groupSearchBehavior only affects search)
  if (!normalizedQuery) {
    return {
      displayNodes: getBrowseNodesPreserve(nodes, highlightedId, getNodeForDef),
      isDeepSearching: false,
    }
  }

  // Search mode - dispatch based on group search behavior
  if (groupSearchBehavior === 'preserve') {
    return filterNodesPreserve(normalizedOptions)
  }

  return filterNodesFlatten(normalizedOptions)
}

// ============================================================================
// Async Node Collection & Merging
// ============================================================================

/**
 * Info about an async branch node (submenu/subpage) for registration.
 */
export interface AsyncSubmenuInfo {
  /** Unique identifier (uses node value and breadcrumbs) */
  id: string
  /** Breadcrumbs path to this branch node */
  breadcrumbs: string[]
  /** The branch node definition */
  node: SubmenuDef | SubpageDef
  /** The async configuration */
  config: AsyncNodesConfig
}

/**
 * Collects all async branch nodes from a node tree.
 * Recursively traverses groups and branches to find all async configurations.
 */
export function collectAsyncSubmenus(
  nodes: NodeDef[],
  breadcrumbs: string[] = [],
  includeInDeepSearch: IncludeInDeepSearch = true,
  descendantsIncluded = true,
): AsyncSubmenuInfo[] {
  const result: AsyncSubmenuInfo[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      continue
    }

    if (node.kind === 'group') {
      // Recurse into groups
      result.push(
        ...collectAsyncSubmenus(
          node.nodes,
          breadcrumbs,
          includeInDeepSearch,
          descendantsIncluded,
        ),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      if (node.hidden) continue
      // Recurse into radio groups
      result.push(
        ...collectAsyncSubmenus(
          node.nodes,
          breadcrumbs,
          includeInDeepSearch,
          descendantsIncluded,
        ),
      )
      continue
    }

    if (node.kind === 'submenu' || node.kind === 'subpage') {
      if (node.hidden) continue

      const branchIncludeMode = node.includeInDeepSearch ?? includeInDeepSearch
      const shouldIncludeBranchDescendants =
        descendantsIncluded &&
        branchIncludeMode === true &&
        node.deepSearch !== false

      // If this branch has async nodes, add it to the result
      if (node.asyncNodes && shouldIncludeBranchDescendants) {
        // Must match getAsyncLoaderIdForBranch's value-only path-key scheme.
        const id = [...breadcrumbs, normalizeValue(node.value)].join('.')
        result.push({
          id,
          breadcrumbs,
          node,
          config: node.asyncNodes,
        })
      }

      // Recurse into branch node's static nodes
      if (node.nodes && shouldIncludeBranchDescendants) {
        const childBreadcrumbs = [...breadcrumbs, normalizeValue(node.value)]
        result.push(
          ...collectAsyncSubmenus(
            node.nodes,
            childBreadcrumbs,
            includeInDeepSearch,
            true,
          ),
        )
      }
    }
  }

  return result
}

/**
 * Merges async nodes into a submenu's node list.
 * Static nodes come first, async nodes are appended.
 */
export function mergeSubmenuNodes(
  staticNodes: NodeDef[] | undefined,
  asyncNodes: NodeDef[] | undefined,
): NodeDef[] {
  const static_ = staticNodes ?? []
  const async_ = asyncNodes ?? []
  return [...static_, ...async_]
}

/**
 * Async data from the coordinator ready for merging.
 */
interface AsyncNodeData {
  id: string
  breadcrumbs: string[]
  nodes: NodeDef[]
}

/**
 * Creates a merged content tree with async nodes injected at their proper locations.
 * This function modifies the tree to include async nodes where they belong.
 */
export function mergeAsyncNodesIntoTree(
  staticContent: NodeDef[],
  asyncData: AsyncNodeData[],
): NodeDef[] {
  // If no async data, return static content as-is
  if (asyncData.length === 0) {
    return staticContent
  }

  // Build a map of async data by breadcrumb path
  const asyncMap = new Map<string, NodeDef[]>()
  for (const data of asyncData) {
    // The id is the full path including the submenu value
    // We need to find the parent path to inject into
    asyncMap.set(data.id, data.nodes)
  }

  // Recursively merge async nodes into the tree
  function mergeRecursive(
    nodes: NodeDef[],
    currentBreadcrumbs: string[],
  ): NodeDef[] {
    return nodes.map((node) => {
      if (node.kind === 'submenu' || node.kind === 'subpage') {
        // Must match getAsyncLoaderIdForBranch's value-only path-key scheme.
        const branchPath = [
          ...currentBreadcrumbs,
          normalizeValue(node.value),
        ].join('.')
        const asyncNodes = asyncMap.get(branchPath)

        // Get merged child nodes
        const mergedStaticChildren = node.nodes
          ? mergeRecursive(node.nodes, [
              ...currentBreadcrumbs,
              normalizeValue(node.value),
            ])
          : undefined

        // If there are async nodes for this submenu, merge them
        if (asyncNodes) {
          return {
            ...node,
            nodes: mergeSubmenuNodes(mergedStaticChildren, asyncNodes),
          }
        }

        // If children were modified, return updated node
        if (mergedStaticChildren !== node.nodes) {
          return { ...node, nodes: mergedStaticChildren }
        }
      }

      if (node.kind === 'group') {
        const mergedChildren = mergeRecursive(node.nodes, currentBreadcrumbs)
        if (mergedChildren !== node.nodes) {
          return { ...node, nodes: mergedChildren }
        }
      }

      // Radio groups contain static RadioItemDef[] and don't support async loading,
      // so we skip processing them in the async merge
      if (node.kind === 'radio-group') {
        return node
      }

      return node
    })
  }

  return mergeRecursive(staticContent, [])
}

/**
 * Checks if a submenu should appear in deep search results.
 * `trigger-only` still includes the submenu trigger row.
 */
export function shouldIncludeInDeepSearch(
  includeInDeepSearch: IncludeInDeepSearch | undefined,
): boolean {
  return includeInDeepSearch !== false
}

/**
 * Checks if submenu descendants (rows inside submenu) should be included.
 * `trigger-only` excludes descendants.
 */
export function shouldIncludeSubmenuRowsInDeepSearch(
  includeInDeepSearch: IncludeInDeepSearch | undefined,
): boolean {
  return includeInDeepSearch === true
}

/**
 * Checks if an async loader should be rendered eagerly.
 * Eager loaders mount when the root menu opens (before their submenu is opened).
 */
export function shouldLoadEagerly(config: AsyncNodesConfig): boolean {
  if (config.type === 'query') {
    const initialLoadWhen =
      config.initialQueryBehavior === false
        ? 'needed'
        : (config.initialQueryBehavior?.loadWhen ?? 'needed')

    if (initialLoadWhen === 'parent-open') {
      return true
    }
  }

  // Both static and query loaders can still opt into legacy eager strategy.
  return config.loadStrategy === 'eager'
}
