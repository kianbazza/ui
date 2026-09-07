import type { PopupMenuNode } from '../menu-tree/types.js'
import type { NodeDef } from './types.js'

const syntheticDefOwner = new WeakMap<NodeDef, PopupMenuNode>()

export function defsOf(nodes: readonly PopupMenuNode[]): NodeDef[] {
  return nodes.map((node) => {
    if (
      node.kind !== 'submenu' &&
      node.kind !== 'subpage' &&
      node.kind !== 'group' &&
      node.kind !== 'radio-group' &&
      node.kind !== 'tree-item'
    ) {
      return node.def
    }
    const childDefs = defsOf(node.children)
    const authored = (node.def as NodeDef & { nodes?: NodeDef[] }).nodes ?? []
    if (
      childDefs.length === authored.length &&
      childDefs.every((def, index) => def === authored[index])
    ) {
      return node.def
    }
    const synthetic = { ...node.def, nodes: childDefs } as NodeDef
    syntheticDefOwner.set(synthetic, node)
    return synthetic
  })
}

export function ownerOfDef(def: NodeDef): PopupMenuNode | undefined {
  return syntheticDefOwner.get(def)
}
