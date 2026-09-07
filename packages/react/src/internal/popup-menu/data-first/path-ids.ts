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
 * Computes a deterministic page ID for a subpage node.
 *
 * Priority:
 * - explicit `node.pageId`
 * - derived from breadcrumb and node segments following the canonical rule:
 *   explicit `id` verbatim, otherwise slugified `value`
 */
export function getSubpagePageId(
  node: SubpageDef,
  breadcrumbs: BreadcrumbNode[],
): string {
  if (node.pageId) {
    return node.pageId
  }

  const breadcrumbSegments = breadcrumbs
    .map((breadcrumb) => breadcrumb.id ?? slugify(breadcrumb.value))
    .filter(Boolean)
  const leafSegment = node.id ?? slugify(node.value)
  const path = [...breadcrumbSegments, leafSegment].filter(Boolean).join('.')

  return path ? `subpage.${path}` : 'subpage'
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
