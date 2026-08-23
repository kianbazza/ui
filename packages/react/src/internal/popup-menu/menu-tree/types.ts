import type { NodeDef } from '../deep-search/types.js'

/**
 * A menu node: the library-created, resolved instance of a node def.
 * Exactly one per logical row per menu root, in every render context —
 * object identity is Resolved ID identity, and `id` is its serialization.
 * Created by resolution at the root or by grafting; instances are stable
 * across content re-supplies (reconciliation swaps `def` in place).
 * The type parameter narrows `def`/`kind` for callers that know the def kind
 * statically. Narrowing is a lookup-time snapshot: reconcile may replace `def`
 * in place with another def of the same resolved id, so a long-held narrowed
 * reference sees the current def, not necessarily the exact object/type it was
 * looked up with.
 */
export interface PopupMenuNode<D extends NodeDef = NodeDef> {
  /** The originating def. Replaced in place when content is re-supplied. */
  def: D
  /** Mirror of `def.kind`, stable for the node's lifetime. */
  kind: D['kind']
  /**
   * This node's path component: explicit `def.id` verbatim when present,
   * otherwise the slugified `value` (kinds without a display value use
   * their required `id`; id-less separators have an empty Definition Key).
   */
  definitionKey: string
  /**
   * Definition Path: Definition Keys from the menu root to this node,
   * including its own key, root-first. Only submenu, subpage, and tree-item
   * ancestors contribute keys (groups and radio-groups are path-transparent).
   * Empty keys are dropped.
   */
  definitionPath: string[]
  /** Resolved ID: `def.id` verbatim when present, else `definitionPath.join('.')`. */
  id: string
  parent: PopupMenuNode | null
  children: PopupMenuNode[]
  /** Def-tree depth counting every node kind; roots are 0. */
  depth: number
  /** Sibling index in the def tree (position within `parent.children`). */
  index: number
}

/**
 * A menu node before its resolved ID is assigned — the argument to `GetResolvedIdFn`.
 * Carries definitional facts only (`def`, `definitionKey`, `definitionPath`, resolved
 * `parent`, `depth`, def-tree sibling `index`). Contextual facts (search
 * state, deep-search flags, display position) are deliberately absent:
 * a context-dependent Resolved ID is inexpressible by construction.
 */
export type UnresolvedMenuNode = Omit<PopupMenuNode, 'id'>

/**
 * Computes a node's Resolved ID from definitional facts. The ID must be unique
 * per menu root; it is the identity persistent state, registration, and
 * highlight key off.
 *
 * Contract: the id may read the node's own facts (including its own sibling
 * `index`) and may walk `parent` for lineage (as the default definition-path
 * rule does), but it must not depend on an *ancestor's* sibling `index` —
 * reconciliation invalidates ids by def identity and definition path, not by
 * ancestor reordering, so ancestor-index-dependent ids would go stale. The
 * seam must also not mutate its argument.
 */
export type GetResolvedIdFn = (node: UnresolvedMenuNode) => string
