// ============================================================================
// Build Display Nodes
// ============================================================================

import type { DisplayRowNode, RowRenderContext, ScoredNode } from './types.js'

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
      highlighted: scoredNode.node.def.id === highlightedId,
      disabled: scoredNode.node.def.disabled ?? false,
      group: scoredNode.group
        ? { id: scoredNode.group.id, label: scoredNode.group.label }
        : null,
      tree: null,
    }

    return {
      kind: 'row',
      node: scoredNode.node,
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
export function buildDisplayRowNode(
  scoredNode: ScoredNode,
  query: string,
  highlightedId: string | null,
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
    highlighted: scoredNode.node.def.id === highlightedId,
    disabled: scoredNode.node.def.disabled ?? false,
    group: scoredNode.group
      ? { id: scoredNode.group.id, label: scoredNode.group.label }
      : null,
    tree: null,
  }

  return {
    kind: 'row',
    node: scoredNode.node,
    context,
    radioGroup: scoredNode.radioGroup
      ? { id: scoredNode.radioGroup.id, label: scoredNode.radioGroup.label }
      : undefined,
  }
}

// ============================================================================
