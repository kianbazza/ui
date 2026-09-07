// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

import type { PopupMenuNode } from '../menu-tree/types.js'
import { resolveDetachedNodeForDef } from './detached.js'
import { getSupportedTreeChildren } from './flatten.js'
import type {
  BreadcrumbNode,
  DisplayNode,
  DisplayRowNode,
  GroupRenderContext,
  NodeDef,
  RowRenderContext,
  TreeItemDef,
} from './types.js'

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
