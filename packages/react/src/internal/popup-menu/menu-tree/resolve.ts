import { slugify } from '../../listbox/utils/normalize.js'
import type { NodeDef } from '../data-first/types.js'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
  PopupMenuNode,
  UnresolvedMenuNode,
} from './types.js'

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

function encodeDefinitionPathEntry(entry: string): string {
  let encoded = ''
  for (let index = 0; index < entry.length; index += 1) {
    const codeUnit = entry.charCodeAt(index)
    const isSafe =
      (codeUnit >= 0x41 && codeUnit <= 0x5a) ||
      (codeUnit >= 0x61 && codeUnit <= 0x7a) ||
      (codeUnit >= 0x30 && codeUnit <= 0x39) ||
      codeUnit === 0x2e ||
      codeUnit === 0x5f ||
      codeUnit === 0x7e ||
      codeUnit === 0x2d
    encoded += isSafe
      ? String.fromCharCode(codeUnit)
      : `%${codeUnit.toString(16).padStart(4, '0')}`
  }
  return encoded
}

/** Default Resolved ID, using surface-scoped encoded paths unless menu scope is selected. */
export function defaultGetResolvedId(
  node: UnresolvedMenuNode,
  idScope: PopupMenuIdScope = 'surface',
): string {
  if (idScope === 'menu') return node.definitionKey
  return node.definitionPath.map(encodeDefinitionPathEntry).join('/')
}

/** Definition Key for a def: explicit `id` verbatim, else slugified `value`. */
export function definitionKeyForDef(def: NodeDef): string {
  switch (def.kind) {
    case 'group':
    case 'radio-group':
      return def.id
    case 'separator':
      return def.id
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
  return def.kind === 'submenu' || def.kind === 'subpage'
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
    const definitionPath = [...basePath, definitionKey]
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
