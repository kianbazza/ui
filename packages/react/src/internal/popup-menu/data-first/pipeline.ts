// ============================================================================
// Full Pipeline
// ============================================================================

import { normalizeValue } from '../../listbox/utils/normalize.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import { getBrowseNodesPreserve } from './browse.js'
import { buildDisplayRowNode, buildDisplayRowNodes } from './display.js'
import { flattenNodes } from './flatten.js'
import { scoreNodes } from './score.js'
import {
  compareScoredNodesByForceOrderAndScore,
  deduplicateNodes,
  getMinForceOrderFromDisplayRows,
  getNodeForceOrder,
  getRowKindSortRank,
  partitionByKind,
  sortByForceOrderThenKindThenScore,
  sortByScore,
} from './sort.js'
import type {
  BreadcrumbNode,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  FlattenedNode,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  IncludeInDeepSearch,
  RadioGroupBehavior,
  RadioGroupDef,
  ScoredNode,
} from './types.js'

const identityQuery = (query: string) => query

// Full Pipeline
// ============================================================================

export interface FilterNodesOptions {
  /** The search query */
  query: string
  /** Optional query normalizer. Defaults to trimming whitespace. */
  normalizeQuery?: (query: string) => string
  /** The node definitions to filter */
  nodes: readonly PopupMenuNode[]
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
      menuNode: PopupMenuNode<RadioGroupDef>
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
            menuNode: flatNode.radioGroup.menuNode,
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
      menuNode: PopupMenuNode<RadioGroupDef>
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
            menuNode: scoredNode.radioGroup.menuNode,
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
  )

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: DisplayRadioGroupNode[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { items: matchingItems, breadcrumbs },
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
        node: radioGroupItems.get(radioGroupId)!.menuNode,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
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
      menuNode: PopupMenuNode<RadioGroupDef>
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
            menuNode: flatNode.radioGroup.menuNode,
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
    {
      groupDef: GroupDef
      menuNode: PopupMenuNode<GroupDef>
      items: ScoredNode[]
      breadcrumbs: BreadcrumbNode[]
    }
  >()
  const radioGroupedItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      menuNode: PopupMenuNode<RadioGroupDef>
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
            menuNode: scoredNode.radioGroup.menuNode,
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
          menuNode: scoredNode.group.menuNode,
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
  for (const [_groupId, { items, breadcrumbs }] of groupedItems) {
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
      node: groupedItems.get(_groupId)!.menuNode,
      context: groupContext,
      items: items.map((item) =>
        buildDisplayRowNode(item, query, highlightedId),
      ),
      bestScore,
    })
  }

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: DisplayRadioGroupNode[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { items: matchingItems, breadcrumbs },
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
        node: radioGroupedItems.get(radioGroupId)!.menuNode,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  // Build display nodes for ungrouped items
  const ungroupedDisplayNodes: DisplayRowNode[] = ungroupedItems
    .sort(compareScoredNodesByForceOrderAndScore)
    .map((item) => buildDisplayRowNode(item, query, highlightedId))

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
      displayNodes: getBrowseNodesPreserve(nodes, highlightedId),
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
