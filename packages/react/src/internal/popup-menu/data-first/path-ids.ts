// ============================================================================
// Path and ID Helpers
// ============================================================================

import { normalizeValue, slugify } from '../../listbox/utils/normalize.js'
import type { BreadcrumbNode, SubmenuDef, SubpageDef } from './types.js'

// ============================================================================
/**
 * Computes a row's canonical definition-tree path (`definitionPath`): the display
 * path of the computing surface, then submenu/subpage breadcrumb components,
 * then the node's own Definition Key (`id`, or its slugified `value`),
 * root-first. Tree-item breadcrumbs are transparent and empty keys are kept.
 * Identical wherever the row renders — browse, deep search, or recursion.
 */
export function computeDefPath(
  displayPath: string[],
  breadcrumbs: BreadcrumbNode[],
  id: string | undefined,
  value: string,
): string[] {
  return [
    ...displayPath,
    ...breadcrumbs
      .filter(
        (breadcrumb) =>
          breadcrumb.node.kind === 'submenu' ||
          breadcrumb.node.kind === 'subpage',
      )
      .map((b) => b.id ?? slugify(b.value)),
    id ?? slugify(value),
  ]
}

/**
 * Path key for a branch's async loader. **Value-only by design** — breadcrumb
 * and leaf `value`s, normalized and dot-joined; explicit `id`s are deliberately
 * ignored. Must stay consistent with the key computations inside
 * `collectAsyncSubmenus` and `mergeAsyncNodesIntoTree`.
 */
export function getAsyncLoaderIdForBranch(
  node: SubmenuDef | SubpageDef,
  breadcrumbs: BreadcrumbNode[],
): string {
  return [
    ...breadcrumbs.map((breadcrumb) => normalizeValue(breadcrumb.value)),
    normalizeValue(node.value),
  ].join('.')
}
