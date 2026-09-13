// ============================================================================
// Build Display Nodes
// ============================================================================

import type { PopupMenuNode } from '../menu-tree/types.js'
import { resolveDetachedNodeForDef } from './detached.js'
import type {
  DisplayRowNode,
  NodeDef,
  RowRenderContext,
  ScoredNode,
} from './types.js'

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
export function buildDisplayRowNode(
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
