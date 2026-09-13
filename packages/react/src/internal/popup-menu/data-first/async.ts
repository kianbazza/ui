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
