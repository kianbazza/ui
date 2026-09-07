import { describe, expect, it } from 'vitest'
import type { NodeDef } from '../../deep-search/types.js'
import { computeDefPath } from '../../deep-search/utils.js'
import { defaultGetResolvedId, resolveNodeDefs } from '../resolve.js'

const item = (value: string, id?: string): NodeDef =>
  ({ kind: 'item', value, id, render: () => null }) as NodeDef

const submenu = (value: string, nodes: NodeDef[], id?: string): NodeDef =>
  ({ kind: 'submenu', value, id, nodes, render: () => null }) as NodeDef

describe('resolveNodeDefs', () => {
  it('resolves flat items', () => {
    const [node] = resolveNodeDefs(
      [item('Apple')],
      null,
      [],
      defaultGetResolvedId,
    )

    expect(node).toMatchObject({
      definitionKey: 'apple',
      definitionPath: ['apple'],
      id: 'apple',
      depth: 0,
      index: 0,
      parent: null,
    })
  })

  it('preserves explicit ids verbatim', () => {
    const [node] = resolveNodeDefs(
      [item('Apple', 'Custom ID!')],
      null,
      [],
      defaultGetResolvedId,
    )

    expect(node).toMatchObject({
      definitionKey: 'Custom ID!',
      definitionPath: ['Custom ID!'],
      id: 'Custom ID!',
    })
  })

  it('resolves submenu lineage', () => {
    const [node] = resolveNodeDefs(
      [submenu('Status', [item('Backlog')])],
      null,
      [],
      defaultGetResolvedId,
    )
    const child = node.children[0]

    expect(child).toMatchObject({
      definitionPath: ['status', 'backlog'],
      id: 'status.backlog',
      parent: node,
      depth: 1,
    })
  })

  it('keeps groups path-transparent', () => {
    const group = {
      kind: 'group',
      id: 'g1',
      nodes: [item('Backlog')],
    } as NodeDef
    const [node] = resolveNodeDefs([group], null, [], defaultGetResolvedId)
    const child = node.children[0]

    expect(node).toMatchObject({
      id: 'g1',
      definitionKey: 'g1',
      definitionPath: ['g1'],
    })
    expect(child).toMatchObject({
      definitionPath: ['backlog'],
      id: 'backlog',
      depth: 1,
      parent: node,
    })
  })

  it('keeps radio-groups path-transparent and uses their id as Definition Key', () => {
    const radioGroup = {
      kind: 'radio-group',
      id: 'rg1',
      value: 'selected-value',
      nodes: [{ kind: 'radio-item', value: 'Backlog', render: () => null }],
    } as NodeDef
    const [node] = resolveNodeDefs([radioGroup], null, [], defaultGetResolvedId)
    const child = node.children[0]

    expect(node).toMatchObject({
      definitionKey: 'rg1',
      id: 'rg1',
      definitionPath: ['rg1'],
    })
    expect(child).toMatchObject({ definitionPath: ['backlog'], id: 'backlog' })
  })

  it('includes tree-item Definition Keys in descendant paths', () => {
    const treeItem = {
      kind: 'tree-item',
      value: 'Fruits',
      nodes: [item('Apple')],
      render: () => null,
    } as NodeDef
    const [node] = resolveNodeDefs([treeItem], null, [], defaultGetResolvedId)

    expect(node.children[0]).toMatchObject({
      definitionPath: ['fruits', 'apple'],
      id: 'fruits.apple',
    })
  })

  it('drops empty Definition Keys from paths', () => {
    const [node] = resolveNodeDefs(
      [submenu('⚙️', [item('Backlog')])],
      null,
      [],
      defaultGetResolvedId,
    )

    expect(node).toMatchObject({
      definitionKey: '',
      definitionPath: [],
      id: '',
    })
    expect(node.children[0]).toMatchObject({
      definitionPath: ['backlog'],
      id: 'backlog',
    })
  })

  it('resolves id-less separators', () => {
    const nodes = resolveNodeDefs(
      [item('a'), { kind: 'separator' }, item('b')] as NodeDef[],
      null,
      [],
      defaultGetResolvedId,
    )

    expect(nodes[1]).toMatchObject({ definitionKey: '', id: '', index: 1 })
  })

  it('matches computeDefPath for nested contributing ancestors', () => {
    const root = submenu('Status', [
      submenu('Open Items', [item('Backlog')], 'open-items-id'),
    ])
    const leaf = resolveNodeDefs([root], null, [], defaultGetResolvedId)[0]
      .children[0].children[0]
    const ancestorDefinitionKeys = ['status', 'open-items-id']

    expect(leaf.definitionPath).toEqual(
      computeDefPath(ancestorDefinitionKeys, [], undefined, 'Backlog'),
    )
  })
})
