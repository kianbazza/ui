// ============================================================================
// Async Node Collection & Merging
// ============================================================================

import { normalizeValue } from '../../listbox/utils/normalize.js'
import type {
  AsyncNodesConfig,
  IncludeInDeepSearch,
  NodeDef,
  SubmenuDef,
  SubpageDef,
} from './types.js'

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
