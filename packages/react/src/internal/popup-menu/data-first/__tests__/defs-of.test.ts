import { describe, expect, it } from 'vitest'
import { createMenuTreeResolver } from '../../menu-tree/resolver.js'
import { defsOf, ownerOfDef } from '../defs-of.js'
import type { GroupDef, NodeDef, SubmenuDef } from '../types.js'

const item = (value: string, id?: string): NodeDef =>
  ({ kind: 'item', value, id, render: () => null }) as NodeDef

const submenu = (value: string, nodes: NodeDef[], id?: string): SubmenuDef =>
  ({ kind: 'submenu', value, id, nodes, render: () => null }) as SubmenuDef

const group = (id: string, nodes: NodeDef[]): GroupDef =>
  ({ kind: 'group', id, nodes }) as GroupDef

describe('defsOf', () => {
  it('returns authored defs by reference when nothing was grafted', () => {
    const submenuDef = submenu('Status', [item('Backlog')])
    const resolver = createMenuTreeResolver()
    resolver.setContent([submenuDef])

    const defs = defsOf(resolver.rootNodes)

    expect(defs[0]).toBe(submenuDef)
    expect(ownerOfDef(defs[0]!)).toBeUndefined()
  })

  it('synthesises a branch def with grafted children and records its owner', () => {
    const staticItem = item('Backlog')
    const loadedItem = item('Loaded')
    const submenuDef = submenu('Status', [staticItem])
    const resolver = createMenuTreeResolver()
    resolver.setContent([submenuDef])
    const branchNode = resolver.rootNodes[0]!

    resolver.graft(branchNode, [staticItem, loadedItem])
    const defs = defsOf(resolver.rootNodes)
    const synthetic = defs[0] as SubmenuDef

    expect(synthetic).not.toBe(submenuDef)
    expect(synthetic.nodes).toHaveLength(2)
    expect(synthetic.nodes![0]).toBe(staticItem)
    expect(synthetic.nodes![1]).toBe(loadedItem)
    expect(ownerOfDef(synthetic)).toBe(branchNode)
  })

  it('propagates a deep graft through a transparent group', () => {
    const staticItem = item('Backlog')
    const loadedItem = item('Loaded')
    const submenuDef = submenu('Status', [staticItem])
    const groupDef = group('filters', [submenuDef])
    const resolver = createMenuTreeResolver()
    resolver.setContent([groupDef])
    const groupNode = resolver.rootNodes[0]!
    const submenuNode = groupNode.children[0]!

    resolver.graft(submenuNode, [staticItem, loadedItem])
    const defs = defsOf(resolver.rootNodes)
    const syntheticGroup = defs[0] as GroupDef
    const syntheticSubmenu = syntheticGroup.nodes[0] as SubmenuDef

    expect(syntheticGroup).not.toBe(groupDef)
    expect(syntheticSubmenu).not.toBe(submenuDef)
    expect(syntheticSubmenu.nodes![1]).toBe(loadedItem)
    expect(ownerOfDef(syntheticGroup)).toBe(groupNode)
    expect(ownerOfDef(syntheticSubmenu)).toBe(submenuNode)
  })
})
