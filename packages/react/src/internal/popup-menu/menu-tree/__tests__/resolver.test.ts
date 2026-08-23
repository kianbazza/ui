import { describe, expect, it, vi } from 'vitest'
import type { NodeDef } from '../../deep-search/types.js'
import { defaultGetResolvedId, resolveNodeDefs } from '../resolve.js'
import { createMenuTreeResolver } from '../resolver.js'

const item = (value: string, id?: string): NodeDef =>
  ({ kind: 'item', value, id, render: () => null }) as NodeDef

const submenu = (value: string, nodes: NodeDef[], id?: string): NodeDef =>
  ({ kind: 'submenu', value, id, nodes, render: () => null }) as NodeDef

const group = (id: string, nodes: NodeDef[]): NodeDef =>
  ({ kind: 'group', id, nodes }) as NodeDef

describe('createMenuTreeResolver', () => {
  it('initially resolves nested content and supports both lookups', () => {
    const backlog = item('Backlog')
    const status = submenu('Status', [backlog])
    const resolver = createMenuTreeResolver()

    resolver.setContent([status])

    expect(resolver.rootNodes).toEqual(
      resolveNodeDefs([status], null, [], defaultGetResolvedId),
    )
    expect(resolver.getNodeById('status.backlog')?.def).toBe(backlog)
    expect(resolver.getNodeForDef(backlog)).toBe(
      resolver.getNodeById('status.backlog'),
    )
  })

  it('is idempotent when setContent receives the same array', () => {
    const defs = [submenu('Status', [item('Backlog')]), item('Settings')]
    const resolver = createMenuTreeResolver()
    resolver.setContent(defs)
    const before = [...resolver.rootNodes, ...resolver.rootNodes[0]!.children]

    resolver.setContent(defs)

    const after = [...resolver.rootNodes, ...resolver.rootNodes[0]!.children]
    after.forEach((node, index) => {
      expect(node).toBe(before[index])
    })
  })

  it('preserves a same-kind duplicate id when a mixed-kind sibling appears', () => {
    const resolver = createMenuTreeResolver()
    const originalSubmenu = submenu('Sub', [item('Child')], 'x')
    resolver.setContent([item('Old', 'x'), originalSubmenu])
    const submenuNode = resolver.rootNodes[1]!

    // The separator cannot match either existing node (kind mismatch), and
    // must not consume the item candidate for id 'x' — the ref-equal submenu
    // def must still match its surviving instance.
    resolver.setContent([
      { kind: 'separator', id: 'x' } as NodeDef,
      originalSubmenu,
    ])

    expect(resolver.rootNodes[1]).toBe(submenuNode)
  })

  it('reconciles a fresh content tree by id while swapping defs', () => {
    const oldBacklog = item('Backlog')
    const oldStatus = submenu('Status', [oldBacklog])
    const resolver = createMenuTreeResolver()
    resolver.setContent([oldStatus])
    const oldStatusNode = resolver.rootNodes[0]!
    const oldBacklogNode = oldStatusNode.children[0]!

    const newBacklog = item('Backlog')
    const newStatus = submenu('Status', [newBacklog])
    resolver.setContent([newStatus])

    expect(resolver.rootNodes[0]).toBe(oldStatusNode)
    expect(oldStatusNode.children[0]).toBe(oldBacklogNode)
    expect(oldStatusNode.def).toBe(newStatus)
    expect(oldBacklogNode.def).toBe(newBacklog)
    expect(resolver.getNodeForDef(oldBacklog)).toBeUndefined()
    expect(resolver.getNodeForDef(newBacklog)).toBe(oldBacklogNode)
  })

  it('uses the reference fast path for an unchanged subtree', () => {
    const stableChild = item('Stable child')
    const stable = submenu('Stable', [stableChild])
    const resolver = createMenuTreeResolver()
    resolver.setContent([stable, item('Other')])
    const stableNode = resolver.rootNodes[0]!
    const childNode = stableNode.children[0]!
    const freshOther = item('Other')

    resolver.setContent([stable, freshOther])

    expect(resolver.rootNodes[0]).toBe(stableNode)
    expect(stableNode.children[0]).toBe(childNode)
    expect(resolver.rootNodes[1]!.def).toBe(freshOther)
  })

  it('adds, removes, and reorders nodes by id', () => {
    const a = item('A')
    const b = item('B')
    const c = item('C')
    const resolver = createMenuTreeResolver()
    resolver.setContent([a, b])
    const aNode = resolver.getNodeForDef(a)!

    const freshA = item('A')
    resolver.setContent([c, freshA])

    expect(resolver.getNodeForDef(b)).toBeUndefined()
    expect(resolver.getNodeById('b')).toBeUndefined()
    expect(resolver.getNodeForDef(a)).toBeUndefined()
    expect(resolver.getNodeForDef(freshA)).toBe(aNode)
    expect(resolver.getNodeForDef(c)).toBe(resolver.rootNodes[0])
    expect(resolver.rootNodes.map((node) => node.def.value)).toEqual(['C', 'A'])
    expect(resolver.rootNodes[1]).toBe(aNode)
    expect(resolver.rootNodes.map((node) => node.index)).toEqual([0, 1])
  })

  it('cascades value renames but preserves explicit-id lineage', () => {
    const oldChild = item('Backlog')
    const old = submenu('Status', [oldChild])
    const resolver = createMenuTreeResolver()
    resolver.setContent([old])
    const oldNode = resolver.rootNodes[0]!

    const renamedChild = item('Backlog')
    resolver.setContent([submenu('Workflow', [renamedChild])])
    expect(resolver.rootNodes[0]).not.toBe(oldNode)
    expect(resolver.getNodeById('status.backlog')).toBeUndefined()
    expect(resolver.getNodeById('workflow.backlog')?.def).toBe(renamedChild)

    const explicitChild = item('Backlog')
    const explicit = submenu('Status', [explicitChild], 'status-id')
    resolver.setContent([explicit])
    const explicitNode = resolver.rootNodes[0]!
    const renamedExplicit = submenu('Workflow', [item('Backlog')], 'status-id')
    resolver.setContent([renamedExplicit])
    expect(resolver.rootNodes[0]).toBe(explicitNode)
    expect(explicitNode.definitionPath).toEqual(['status-id'])
    expect(explicitNode.children[0]!.definitionPath).toEqual([
      'status-id',
      'backlog',
    ])
  })

  it('pairwise re-matches duplicate sibling ids', () => {
    const resolver = createMenuTreeResolver()
    const first = item('Same')
    const second = item('Same')
    resolver.setContent([first, second])
    const before = [...resolver.rootNodes]
    const fresh = [item('Same'), item('Same')]
    resolver.setContent(fresh)

    expect(resolver.rootNodes[0]).toBe(before[0])
    expect(resolver.rootNodes[1]).toBe(before[1])
    expect(resolver.getNodeById('same')).toBe(before[0])
  })

  it('replaces a node when its kind changes at a stable id', () => {
    const resolver = createMenuTreeResolver()
    resolver.setContent([item('Old', 'x')])
    const oldNode = resolver.rootNodes[0]!
    const replacement = submenu('New', [item('Child')], 'x')
    resolver.setContent([replacement])

    expect(resolver.rootNodes[0]).not.toBe(oldNode)
    expect(resolver.rootNodes[0]!.kind).toBe('submenu')
    expect(resolver.getNodeById('x')).toBe(resolver.rootNodes[0])
  })

  it('does not disturb grafts when a ref-equal node is reordered', () => {
    const status = submenu('Status', [item('Backlog')])
    const resolver = createMenuTreeResolver()
    resolver.setContent([status, item('Other')])
    const statusNode = resolver.rootNodes[0]!
    resolver.graft(statusNode, [statusNode.children[0]!.def, item('Extra')])
    const extraNode = statusNode.children[1]!

    resolver.setContent([item('Other'), status])

    expect(statusNode.index).toBe(1)
    expect(statusNode.children[1]).toBe(extraNode)
  })

  it('invalidates graft memo after content-driven reconciliation', () => {
    const status = submenu('Status', [item('Backlog')])
    const extra = item('Extra')
    const graftDefs = [status.nodes![0]!, extra]
    const resolver = createMenuTreeResolver()
    resolver.setContent([status])
    const statusNode = resolver.rootNodes[0]!
    resolver.graft(statusNode, graftDefs)
    resolver.setContent([submenu('Status', [item('Backlog')])])
    resolver.graft(resolver.rootNodes[0]!, graftDefs)

    expect(resolver.rootNodes[0]!.children[1]!.id).toBe('status.extra')
    expect(resolver.rootNodes[0]!.children[1]!.def).toBe(extra)
  })

  it('invalidates graft memo after ancestor graft reconciliation', () => {
    const leaf = item('Leaf')
    const extra = item('Extra')
    const a = submenu('A', [submenu('B', [leaf])])
    const resolver = createMenuTreeResolver()
    resolver.setContent([a])
    const aNode = resolver.rootNodes[0]!
    const bNode = aNode.children[0]!
    const graftDefs = [leaf, extra]
    resolver.graft(bNode, graftDefs)
    resolver.graft(aNode, [submenu('B', [leaf])])
    resolver.graft(bNode, graftDefs)

    expect(bNode.children[1]!.id).toBe('a.b.extra')
  })

  it('grafts late children while preserving static children', () => {
    const backlog = item('Backlog')
    const status = submenu('Status', [backlog])
    const inReview = item('In Review')
    const resolver = createMenuTreeResolver()
    resolver.setContent([status])
    const statusNode = resolver.rootNodes[0]!
    const backlogNode = statusNode.children[0]!

    resolver.graft(statusNode, [backlog, inReview])

    expect(statusNode.children[0]).toBe(backlogNode)
    expect(statusNode.children[1]).toMatchObject({
      definitionPath: ['status', 'in-review'],
      id: 'status.in-review',
      parent: statusNode,
      depth: statusNode.depth + 1,
    })
    expect(resolver.getNodeById('status.in-review')).toBe(
      statusNode.children[1],
    )
  })

  it('keeps grafts through a same-root setContent and trims on fresh content', () => {
    const backlog = item('Backlog')
    const inReview = item('In Review')
    const root = [submenu('Status', [backlog])]
    const resolver = createMenuTreeResolver()
    resolver.setContent(root)
    const statusNode = resolver.rootNodes[0]!
    const graftDefs = [backlog, inReview]
    resolver.graft(statusNode, graftDefs)
    const grafted = statusNode.children[1]!
    const childrenBefore = statusNode.children

    // Same array reference → graft memo fast path (children array untouched).
    resolver.graft(statusNode, graftDefs)
    expect(statusNode.children).toBe(childrenBefore)
    expect(statusNode.children[1]).toBe(grafted)
    resolver.setContent(root)
    expect(statusNode.children[1]).toBe(grafted)

    resolver.setContent([submenu('Status', [item('Backlog')])])
    expect(resolver.getNodeById('status.in-review')).toBeUndefined()
    resolver.graft(resolver.rootNodes[0]!, [
      resolver.rootNodes[0]!.children[0]!.def,
      inReview,
    ])
    expect(resolver.rootNodes[0]!.children[1]).not.toBe(grafted)
    expect(resolver.rootNodes[0]!.children[1]!.id).toBe('status.in-review')
  })

  it('uses the submenu base path when grafting under a transparent group', () => {
    const status = submenu('Status', [group('group', [item('Static')])])
    const late = item('Late')
    const resolver = createMenuTreeResolver()
    resolver.setContent([status])
    const groupNode = resolver.rootNodes[0]!.children[0]!

    resolver.graft(groupNode, [groupNode.children[0]!.def, late])

    expect(groupNode.children[1]!.definitionPath).toEqual(['status', 'late'])
    expect(groupNode.children[1]!.id).toBe('status.late')
  })
})

describe('duplicate detection', () => {
  const duplicateWarnings = (warn: ReturnType<typeof vi.spyOn>) =>
    warn.mock.calls.filter(([message]) =>
      String(message).startsWith('[PopupMenu] Duplicate Resolved ID'),
    )

  it('warns once for sibling id-less same-value items', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()

    resolver.setContent([
      item('Duplicate'),
      item('Duplicate'),
      item('Duplicate'),
    ])

    expect(duplicateWarnings(warn)).toHaveLength(1)
    warn.mockRestore()
  })

  it('does not re-warn when the same content is re-supplied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()
    const content = [item('Stable'), item('Stable')]

    resolver.setContent(content)
    resolver.setContent(content)

    expect(duplicateWarnings(warn)).toHaveLength(1)
    warn.mockRestore()
  })

  it('warns for duplicate explicit ids across different branches', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()

    resolver.setContent([
      submenu('Branch A', [item('First', 'branch-shared')]),
      submenu('Branch B', [item('Second', 'branch-shared')]),
    ])

    expect(duplicateWarnings(warn)).toHaveLength(1)
    warn.mockRestore()
  })

  it('does not warn for two id-less separators', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()

    resolver.setContent([{ kind: 'separator' }, { kind: 'separator' }])

    expect(duplicateWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  it('does not warn when a group id collides with an item id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()

    resolver.setContent([
      group('namespace-shared', []),
      item('Row', 'namespace-shared'),
    ])

    expect(duplicateWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  it('does not warn for a kind change at a stable id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()

    resolver.setContent([item('Original', 'stable-kind')])
    resolver.setContent([submenu('Replacement', [], 'stable-kind')])

    expect(duplicateWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })

  it('does not warn for a two-call trim-then-regraft handoff', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const resolver = createMenuTreeResolver()
    const originalChild = item('Handoff')
    const branch = submenu('Handoff branch', [originalChild])

    resolver.setContent([branch])
    resolver.setContent([submenu('Handoff branch', [])])
    resolver.graft(resolver.rootNodes[0]!, [originalChild])

    expect(duplicateWarnings(warn)).toHaveLength(0)
    warn.mockRestore()
  })
})

describe('getResolvedId seam', () => {
  it('custom seam shapes ids', () => {
    const resolver = createMenuTreeResolver({
      getResolvedId: (node) =>
        node.definitionPath.join('/') || node.def.id || '',
    })
    resolver.setContent([submenu('Status', [item('Backlog')])])

    expect(resolver.getNodeById('status/backlog')).toBeDefined()
    expect(resolver.getNodeById('status.backlog')).toBeUndefined()
  })

  it('matching agrees with the seam', () => {
    const resolver = createMenuTreeResolver({
      getResolvedId: (node) =>
        node.definitionPath.join('/') || node.def.id || '',
    })
    resolver.setContent([submenu('Status', [item('Backlog')])])
    const statusNode = resolver.rootNodes[0]!
    const backlogNode = statusNode.children[0]!

    resolver.setContent([submenu('Status', [item('Backlog')])])

    expect(resolver.rootNodes[0]).toBe(statusNode)
    expect(resolver.rootNodes[0]!.children[0]).toBe(backlogNode)
  })

  it('seam receives definitional facts', () => {
    const captures: Array<{
      node: Record<string, unknown>
      hasId: boolean
    }> = []
    const resolver = createMenuTreeResolver({
      getResolvedId: (node) => {
        if (node.parent) {
          captures.push({ node: { ...node }, hasId: 'id' in node })
        }
        return node.definitionPath.join('.')
      },
    })
    resolver.setContent([submenu('Status', [item('Backlog')])])
    const capture = captures[0]!
    const parent = resolver.rootNodes[0]!

    expect(capture.node).toMatchObject({
      def: parent.children[0]!.def,
      definitionKey: 'backlog',
      definitionPath: ['status', 'backlog'],
      parent,
      depth: 1,
      index: 0,
    })
    expect(capture.hasId).toBe(false)
  })

  it('index-dependent seam is stable', () => {
    const resolver = createMenuTreeResolver({
      getResolvedId: (node) => `${node.definitionPath.join('.')}#${node.index}`,
    })
    resolver.setContent([item('First'), item('Second')])
    const before = [...resolver.rootNodes]

    expect(resolver.rootNodes.map((node) => node.id)).toEqual([
      'first#0',
      'second#1',
    ])

    resolver.setContent([item('First'), item('Second')])

    expect(resolver.rootNodes[0]).toBe(before[0])
    expect(resolver.rootNodes[1]).toBe(before[1])
  })

  it('default parity', () => {
    const explicit = item('Ignored', 'explicit')
    const explicitProbe = {
      def: explicit,
      kind: explicit.kind,
      definitionKey: 'explicit',
      definitionPath: ['different'],
      parent: null,
      children: [],
      depth: 0,
      index: 0,
    }
    const idless = item('Ignored')
    const idlessProbe = {
      def: idless,
      kind: idless.kind,
      definitionKey: 'ignored',
      definitionPath: ['path', 'ignored'],
      parent: null,
      children: [],
      depth: 0,
      index: 0,
    }

    expect(defaultGetResolvedId(explicitProbe)).toBe(
      explicit.id ?? explicitProbe.definitionPath.join('.'),
    )
    expect(defaultGetResolvedId(idlessProbe)).toBe(
      idless.id ?? idlessProbe.definitionPath.join('.'),
    )
  })
})
