// ============================================================================
// Detached Node Resolution
// ============================================================================

import {
  defaultGetResolvedId,
  resolveDetachedNode,
} from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import type { NodeDef } from './types.js'

/**
 * Fallback node resolution for callers without a menu-tree resolver (tests and
 * standalone use of the filter helpers). Detached nodes are cached per def, so
 * this stays referentially stable across calls.
 */
export function resolveDetachedNodeForDef<D extends NodeDef>(
  def: D,
): PopupMenuNode<D> {
  return resolveDetachedNode(def, defaultGetResolvedId)
}
