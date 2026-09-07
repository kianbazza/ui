import { slugify } from '../../listbox/utils/normalize.js'
import type { NodeDef } from '../deep-search/types.js'
import type {
  GetResolvedIdFn,
  PopupMenuNode,
  UnresolvedMenuNode,
} from './types.js'

const detachedNodeCache = new WeakMap<
  GetResolvedIdFn,
  WeakMap<NodeDef, PopupMenuNode>
>()

export function isPopupMenuNode(value: unknown): value is PopupMenuNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'def' in value &&
    typeof (value as PopupMenuNode).id === 'string' &&
    typeof (value as PopupMenuNode).definitionKey === 'string' &&
    Array.isArray((value as PopupMenuNode).definitionPath) &&
    Array.isArray((value as PopupMenuNode).children) &&
    typeof (value as PopupMenuNode).depth === 'number' &&
    'parent' in value
  )
}

/** Resolve a single out-of-tree def to a stable detached node (per seam, per def). */
export function resolveDetachedNode<D extends NodeDef>(
  def: D,
  getResolvedId: GetResolvedIdFn,
): PopupMenuNode<D> {
  let perSeam = detachedNodeCache.get(getResolvedId)
  if (!perSeam) {
    perSeam = new WeakMap()
    detachedNodeCache.set(getResolvedId, perSeam)
  }
  let node = perSeam.get(def)
  if (!node) {
    node = resolveNodeDefs([def], null, [], getResolvedId)[0]!
    perSeam.set(def, node)
  }
  // node was built from (or cached under) this exact def; def === node.def
  return node as PopupMenuNode<D>
}

/** Default Resolved ID: explicit `def.id` verbatim, else the joined definition path. */
export function defaultGetResolvedId(node: UnresolvedMenuNode): string {
  return node.def.id ?? node.definitionPath.join('.')
}

/** Definition Key for a def: explicit `id` verbatim, else slugified `value`. */
export function definitionKeyForDef(def: NodeDef): string {
  switch (def.kind) {
    case 'group':
    case 'radio-group':
      return def.id
    case 'separator':
      return def.id ?? ''
    default:
      return def.id ?? slugify(def.value)
  }
}

/** Child defs of a def, in def order; empty for leaf kinds. */
export function childDefsOf(def: NodeDef): readonly NodeDef[] {
  switch (def.kind) {
    case 'group':
    case 'radio-group':
      return def.nodes
    case 'submenu':
    case 'subpage':
    case 'tree-item':
      return def.nodes ?? []
    default:
      return []
  }
}

/** Kinds whose Definition Key is part of their descendants' definition paths. */
export function contributesDefinitionPath(def: NodeDef): boolean {
  return (
    def.kind === 'submenu' || def.kind === 'subpage' || def.kind === 'tree-item'
  )
}

/**
 * Resolve a def list into node instances under `parent`.
 * `basePath` is the path segments contributed by ancestors (the parent's
 * `definitionPath` when the parent contributes a segment, otherwise the parent's
 * own base path); pass `[]` for roots.
 */
export function resolveNodeDefs(
  defs: readonly NodeDef[],
  parent: PopupMenuNode | null,
  basePath: readonly string[],
  getResolvedId: GetResolvedIdFn,
): PopupMenuNode[] {
  return defs.map((def, index) => {
    const definitionKey = definitionKeyForDef(def)
    const definitionPath = definitionKey
      ? [...basePath, definitionKey]
      : [...basePath]
    const unresolved: UnresolvedMenuNode = {
      def,
      kind: def.kind,
      definitionKey,
      definitionPath,
      parent,
      children: [],
      depth: parent ? parent.depth + 1 : 0,
      index,
    }
    // Call the seam before spreading so the node reflects any reads the seam
    // performs on the final definitional facts (spread-then-call would copy
    // the fields before the seam runs).
    const id = getResolvedId(unresolved)
    const node: PopupMenuNode = { ...unresolved, id }
    node.children = resolveNodeDefs(
      childDefsOf(def),
      node,
      contributesDefinitionPath(def) ? node.definitionPath : basePath,
      getResolvedId,
    )
    return node
  })
}
