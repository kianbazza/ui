// ============================================================================
// Sort Nodes
// ============================================================================

import { normalizeValue } from '../../listbox/utils/normalize.js'
import type { DisplayRowNode, ScoredNode } from './types.js'

// Sort Nodes
// ============================================================================

export function getNodeForceOrder(node: { forceOrder?: number }): number {
  return node.forceOrder ?? 0
}

export function compareScoredNodesByForceOrderAndScore(
  a: ScoredNode,
  b: ScoredNode,
): number {
  const orderDiff = getNodeForceOrder(a.node) - getNodeForceOrder(b.node)
  if (orderDiff !== 0) {
    return orderDiff
  }

  return b.score - a.score
}

export function getRowKindSortRank(
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

export function sortByForceOrderThenKindThenScore(
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

export function getMinForceOrderFromDisplayRows(
  nodes: DisplayRowNode[],
): number {
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
