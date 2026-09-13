// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

import type { PopupMenuNode } from '../menu-tree/types.js'
import { getSupportedTreeChildren } from './flatten.js'
import { isMenuNodeOfKind, isRowMenuNode } from './type-guards.js'
import type {
  BreadcrumbNode,
  DisplayNode,
  DisplayRowNode,
  GroupRenderContext,
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
  nodes: readonly PopupMenuNode[],
  highlightedId: string | null,
  group: { id: string; label?: string } | null = null,
): DisplayRowNode[] {
  const result: DisplayRowNode[] = []
  const visibleRowNodes = nodes.filter(
    (node) => isRowMenuNode(node) && !node.def.hidden,
  )

  for (const node of nodes) {
    if (isMenuNodeOfKind(node, 'separator')) {
      // Skip separators - they're not focusable
      continue
    }

    if (isMenuNodeOfKind(node, 'group')) {
      // Recurse into groups, passing group context
      const groupInfo = { id: node.def.id, label: node.def.label }
      result.push(
        ...getBrowseNodesFlatten(node.children, highlightedId, groupInfo),
      )
      continue
    }

    if (isMenuNodeOfKind(node, 'radio-group')) {
      // Radio groups should not be flattened - skip in flatten mode
      // They will be handled by getBrowseNodesPreserve
      continue
    }

    if (!isRowMenuNode(node) || node.def.hidden) {
      continue
    }

    if (isMenuNodeOfKind(node, 'tree-item')) {
      result.push(
        ...expandTreeNode(
          node,
          highlightedId,
          group,
          0,
          [],
          [],
          node === visibleRowNodes.at(-1),
        ),
      )
      continue
    }

    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.def.id === highlightedId,
      disabled: node.def.disabled ?? false,
      group,
      tree: null,
    }

    result.push({ kind: 'row', node, context })
  }

  return result
}

function expandTreeNode(
  node: PopupMenuNode<TreeItemDef>,
  highlightedId: string | null,
  group: { id: string; label?: string } | null,
  depth: number,
  ancestorsLast: boolean[],
  breadcrumbs: BreadcrumbNode[],
  isLastChild: boolean,
): DisplayRowNode[] {
  const supportedChildren = getSupportedTreeChildren(node.children).filter(
    (child) => !child.def.hidden,
  )
  const tree = {
    depth,
    hasChildren: supportedChildren.length > 0,
    isLastChild,
    ancestorsLast,
    header: node.def.selectable === false,
  }
  const rows: DisplayRowNode[] = [
    {
      kind: 'row',
      node,
      context: {
        search: null,
        breadcrumbs,
        isDeepSearchResult: false,
        highlighted: node.def.id === highlightedId,
        disabled: node.def.disabled ?? false,
        group,
        tree,
      },
    },
  ]

  const childBreadcrumb: BreadcrumbNode = {
    node: node.def,
    menuNode: node,
    value: node.def.value,
    id: node.def.id,
  }
  const childBreadcrumbs = [...breadcrumbs, childBreadcrumb]
  supportedChildren.forEach((child, index) => {
    const childIsLast = index === supportedChildren.length - 1
    if (isMenuNodeOfKind(child, 'tree-item')) {
      rows.push(
        ...expandTreeNode(
          child,
          highlightedId,
          group,
          depth + 1,
          [...ancestorsLast, isLastChild],
          childBreadcrumbs,
          childIsLast,
        ),
      )
      return
    }

    rows.push({
      kind: 'row',
      node: child,
      context: {
        search: null,
        breadcrumbs: childBreadcrumbs,
        isDeepSearchResult: false,
        highlighted: child.def.id === highlightedId,
        disabled: child.def.disabled ?? false,
        group,
        tree: {
          depth: depth + 1,
          hasChildren:
            isMenuNodeOfKind(child, 'submenu') && child.children.length > 0,
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
  nodes: readonly PopupMenuNode[],
  highlightedId: string | null,
): DisplayNode[] {
  const result: DisplayNode[] = []

  for (const node of nodes) {
    if (isMenuNodeOfKind(node, 'separator')) {
      // Include separators in browse mode for visual separation
      result.push({ kind: 'separator', node })
      continue
    }

    if (isMenuNodeOfKind(node, 'group')) {
      // Build group items
      const groupItems: DisplayRowNode[] = []
      const visibleGroupChildren = node.children.filter(
        (child) => isRowMenuNode(child) && !child.def.hidden,
      )
      for (const child of node.children) {
        // Skip non-row nodes
        if (
          isMenuNodeOfKind(child, 'separator') ||
          isMenuNodeOfKind(child, 'group') ||
          isMenuNodeOfKind(child, 'radio-group')
        ) {
          continue
        }
        if (!isRowMenuNode(child) || child.def.hidden) continue

        if (isMenuNodeOfKind(child, 'tree-item')) {
          groupItems.push(
            ...expandTreeNode(
              child,
              highlightedId,
              { id: node.def.id, label: node.def.label },
              0,
              [],
              [],
              child === visibleGroupChildren.at(-1),
            ),
          )
          continue
        }

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.def.id === highlightedId,
          disabled: child.def.disabled ?? false,
          group: { id: node.def.id, label: node.def.label },
          tree: null,
        }

        groupItems.push({
          kind: 'row',
          node: child,
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
          node,
          context: groupContext,
          items: groupItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (isMenuNodeOfKind(node, 'radio-group')) {
      if (node.def.hidden) continue

      // Build radio group items
      const radioItems: DisplayRowNode[] = []
      for (const child of node.children) {
        // RadioGroupDef.nodes only contains ItemDef | SubmenuDef | CheckboxItemDef
        if (!isRowMenuNode(child) || child.def.hidden) continue

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.def.id === highlightedId,
          disabled: child.def.disabled ?? false,
          group: null, // Radio items don't belong to a regular group
          tree: null,
        }

        radioItems.push({
          kind: 'row',
          node: child,
          context: itemContext,
          radioGroup: { id: node.def.id, label: node.def.label },
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
          node,
          context: groupContext,
          items: radioItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (!isRowMenuNode(node) || node.def.hidden) {
      continue
    }

    // Ungrouped item/submenu/subpage
    if (isMenuNodeOfKind(node, 'tree-item')) {
      const visibleRowNodes = nodes.filter(
        (sibling) => isRowMenuNode(sibling) && !sibling.def.hidden,
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
        ),
      )
      continue
    }

    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.def.id === highlightedId,
      disabled: node.def.disabled ?? false,
      group: null,
      tree: null,
    }
    result.push({ kind: 'row', node, context })
  }

  return result
}

// ============================================================================
