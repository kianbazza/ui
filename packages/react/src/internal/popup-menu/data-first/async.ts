// ============================================================================
// Async Node Collection & Merging
// ============================================================================

import { staticChildrenOf } from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import type {
  AsyncNodesConfig,
  IncludeInDeepSearch,
  SubmenuDef,
  SubpageDef,
} from './types.js'

// Async Node Collection & Merging
// ============================================================================

/**
 * Info about an async branch node (submenu/subpage) for registration.
 */
export interface AsyncSubmenuInfo {
  /** The branch's Resolved ID — the loader key. */
  id: string
  /** The branch Menu Node (graft target and async-state key). */
  node: PopupMenuNode<SubmenuDef | SubpageDef>
  /** The async configuration */
  config: AsyncNodesConfig
}

/**
 * Collects all async branch nodes from a node tree.
 * Recursively traverses groups and branches to find all async configurations.
 */
function collectAsyncSubmenusRaw(
  nodes: readonly PopupMenuNode[],
  includeInDeepSearch: IncludeInDeepSearch = true,
  descendantsIncluded = true,
): AsyncSubmenuInfo[] {
  const result: AsyncSubmenuInfo[] = []

  for (const node of nodes) {
    if (node.def.kind === 'separator') {
      continue
    }

    if (node.def.kind === 'group') {
      // Recurse into groups
      result.push(
        ...collectAsyncSubmenusRaw(
          staticChildrenOf(node),
          includeInDeepSearch,
          descendantsIncluded,
        ),
      )
      continue
    }

    if (node.def.kind === 'radio-group') {
      if (node.def.hidden) continue
      // Recurse into radio groups
      result.push(
        ...collectAsyncSubmenusRaw(
          staticChildrenOf(node),
          includeInDeepSearch,
          descendantsIncluded,
        ),
      )
      continue
    }

    if (node.def.kind === 'submenu' || node.def.kind === 'subpage') {
      if (node.def.hidden) continue

      const branchIncludeMode =
        node.def.includeInDeepSearch ?? includeInDeepSearch
      const shouldIncludeBranchDescendants =
        descendantsIncluded &&
        branchIncludeMode === true &&
        node.def.deepSearch !== false

      // If this branch has async nodes, add it to the result
      if (node.def.asyncNodes && shouldIncludeBranchDescendants) {
        result.push({
          id: node.id,
          node: node as PopupMenuNode<SubmenuDef | SubpageDef>,
          config: node.def.asyncNodes,
        })
      }

      // Recurse into branch node's static nodes
      if (shouldIncludeBranchDescendants) {
        result.push(
          ...collectAsyncSubmenusRaw(
            staticChildrenOf(node),
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

/**
 * Collects all async branch nodes from a Menu Node tree, one entry per
 * Resolved ID. Recursively traverses groups and branches (static children
 * only) to find every async configuration. A loader result that repeats an
 * authored branch def yields the same Resolved ID and is collapsed.
 */
export function collectAsyncSubmenus(
  nodes: readonly PopupMenuNode[],
  includeInDeepSearch: IncludeInDeepSearch = true,
  descendantsIncluded = true,
): AsyncSubmenuInfo[] {
  const seen = new Set<string>()
  const result: AsyncSubmenuInfo[] = []
  for (const info of collectAsyncSubmenusRaw(
    nodes,
    includeInDeepSearch,
    descendantsIncluded,
  )) {
    if (seen.has(info.id)) continue
    seen.add(info.id)
    result.push(info)
  }
  return result
}
