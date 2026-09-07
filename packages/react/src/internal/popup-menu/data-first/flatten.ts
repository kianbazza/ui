// ============================================================================
// Flatten Nodes for Search
// ============================================================================

import type { PopupMenuNode } from '../menu-tree/types.js'
import { isMenuNodeOfKind, isRowMenuNode } from './type-guards.js'
import type {
  BreadcrumbNode,
  FlattenedNode,
  GroupDef,
  IncludeInDeepSearch,
  ItemDef,
  RadioGroupDef,
  SubmenuDef,
  TreeItemDef,
} from './types.js'

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
  group?: FlattenedNode['group']
  /** Current radio group context */
  radioGroup?: FlattenedNode['radioGroup']
  /** Keywords inherited from tree ancestors. */
  inheritedKeywords?: string[]
}

/** Returns the child kinds supported by v1 inline trees. */
export function getSupportedTreeChildren(
  nodes: readonly PopupMenuNode[],
): Array<PopupMenuNode<TreeItemDef | ItemDef | SubmenuDef>> {
  const supported: Array<PopupMenuNode<TreeItemDef | ItemDef | SubmenuDef>> = []
  for (const node of nodes) {
    if (
      isMenuNodeOfKind(node, 'tree-item') ||
      isMenuNodeOfKind(node, 'item') ||
      isMenuNodeOfKind(node, 'submenu')
    ) {
      supported.push(node)
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`Unsupported ${node.kind} child skipped inside tree-item.`)
    }
  }
  return supported
}

/**
 * Flattens a tree of Menu Nodes into a flat array.
 * When deep=true, includes children of branch nodes with their breadcrumb paths.
 * Tracks group and radio group membership for each node.
 */
export function flattenNodes(
  nodes: readonly PopupMenuNode[],
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
    if (isMenuNodeOfKind(node, 'separator')) {
      // Skip separators during search
      continue
    }

    if (isMenuNodeOfKind(node, 'group')) {
      // Groups are containers - recurse into their children with group context
      // Note: Nested groups are not supported, so we pass this group directly
      const groupInfo = {
        id: node.def.id,
        label: node.def.label,
        groupDef: node.def as GroupDef,
        menuNode: node,
      }
      result.push(
        ...flattenNodes(node.children, {
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

    if (isMenuNodeOfKind(node, 'radio-group')) {
      // Radio groups are containers - recurse into their children with radio group context
      if (node.def.hidden) continue

      const radioGroupInfo = {
        id: node.def.id,
        label: node.def.label,
        radioGroupDef: node.def as RadioGroupDef,
        menuNode: node,
      }
      result.push(
        ...flattenNodes(node.children, {
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

    if (!isRowMenuNode(node)) continue

    if (node.def.hidden) {
      continue
    }

    if (
      isMenuNodeOfKind(node, 'item') ||
      isMenuNodeOfKind(node, 'radio-item') ||
      isMenuNodeOfKind(node, 'checkbox-item')
    ) {
      result.push({ node, breadcrumbs, group, radioGroup, inheritedKeywords })
      continue
    }

    if (isMenuNodeOfKind(node, 'tree-item')) {
      if (node.def.selectable !== false) {
        result.push({ node, breadcrumbs, group, radioGroup, inheritedKeywords })
      }

      if (node.children.length && node.def.deepSearch !== false) {
        const treeBreadcrumb: BreadcrumbNode = {
          node: node.def,
          menuNode: node,
          value: node.def.value,
          id: node.def.id,
        }
        result.push(
          ...flattenNodes(getSupportedTreeChildren(node.children), {
            deep,
            includeInDeepSearch,
            descendantsIncluded,
            breadcrumbs: [...breadcrumbs, treeBreadcrumb],
            group,
            radioGroup,
            inheritedKeywords: [...inheritedKeywords, node.def.value],
          }),
        )
      }
      continue
    }

    if (
      isMenuNodeOfKind(node, 'submenu') ||
      isMenuNodeOfKind(node, 'subpage')
    ) {
      const branchIncludeMode =
        node.def.includeInDeepSearch ?? includeInDeepSearch

      // includeInDeepSearch only affects deep search results.
      // In shallow mode, branch triggers remain searchable as normal rows.
      const shouldIncludeBranchTrigger =
        !deep || (descendantsIncluded && branchIncludeMode !== false)

      if (shouldIncludeBranchTrigger) {
        result.push({ node, breadcrumbs, group, radioGroup, inheritedKeywords })
      }

      // If deep search enabled and branch allows descendants, include children.
      const shouldIncludeBranchDescendants =
        deep &&
        descendantsIncluded &&
        branchIncludeMode === true &&
        node.def.deepSearch !== false

      if (shouldIncludeBranchDescendants && node.children.length) {
        const branchBreadcrumb: BreadcrumbNode = {
          node: node.def,
          menuNode: node,
          value: node.def.value,
          id: node.def.id,
        }
        const childBreadcrumbs: BreadcrumbNode[] = [
          ...breadcrumbs,
          branchBreadcrumb,
        ]

        result.push(
          ...flattenNodes(
            node.children.filter((child) => {
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
