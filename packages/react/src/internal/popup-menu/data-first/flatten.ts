// ============================================================================
// Flatten Nodes for Search
// ============================================================================

import type {
  BreadcrumbNode,
  CheckboxItemDef,
  GroupDef,
  IncludeInDeepSearch,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
  SubmenuDef,
  SubpageDef,
  TreeItemDef,
} from './types.js'

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

export interface FlattenedNode {
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
