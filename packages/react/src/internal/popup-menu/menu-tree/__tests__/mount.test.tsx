import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import { useMenuTreeResolver } from '../../contexts/menu-tree-resolver-context.js'
import type { ItemDef, NodeDef, SubmenuDef } from '../../deep-search/types.js'
import type { MenuTreeResolver } from '../resolver.js'
import type { GetResolvedIdFn, PopupMenuIdScope } from '../types.js'

function item(value: string): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props }) => (
      <DropdownMenu.Item {...props}>{value}</DropdownMenu.Item>
    ),
  }
}

function Rows() {
  const { nodes, renderNode } = DropdownMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

function Probe({
  onResolver,
}: {
  onResolver: (value: MenuTreeResolver) => void
}) {
  const resolver = useMenuTreeResolver()
  if (resolver) onResolver(resolver)
  return null
}

function Menu({
  content,
  onResolver,
  search = false,
  getResolvedId,
  idScope,
}: {
  content: NodeDef[]
  onResolver: (value: MenuTreeResolver) => void
  search?: boolean
  getResolvedId?: GetResolvedIdFn
  idScope?: PopupMenuIdScope
}) {
  return (
    <DropdownMenu.Root
      defaultOpen
      getResolvedId={getResolvedId}
      idScope={idScope}
    >
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <Probe onResolver={onResolver} />
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={content}
              deepSearch={search ? { enabled: true, minLength: 0 } : undefined}
            >
              {search && <DropdownMenu.Input aria-label="Search" />}
              <DropdownMenu.List>
                <Rows />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function submenu(
  value: string,
  nodes: NodeDef[],
  nestedContent: NodeDef[] | (() => NodeDef[]),
): SubmenuDef {
  return {
    kind: 'submenu',
    value,
    nodes,
    render: ({ props, context }) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props}>
          {context.value}
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface
                content={
                  typeof nestedContent === 'function'
                    ? nestedContent()
                    : nestedContent
                }
              >
                <DropdownMenu.List>
                  <Rows />
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

describe('mounted menu-tree resolution', () => {
  it('uses the public surface default and explicit menu scope', async () => {
    let resolver!: MenuTreeResolver
    const view = render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={[submenu('Status', [item('Backlog')], [])]}
      />,
    )
    await waitFor(() => expect(resolver.getNodeById('status')).toBeDefined())
    expect(resolver.getNodeById('status')?.id).toBe('status')
    expect(resolver.getNodeById('status')?.children[0]?.id).toBe(
      'status/backlog',
    )

    view.rerender(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        idScope="menu"
        content={[submenu('Status', [item('Backlog')], [])]}
      />,
    )
    expect(resolver.getNodeById('status')?.children[0]?.id).toBe(
      'status/backlog',
    )

    view.unmount()
    render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        idScope="menu"
        content={[submenu('Status', [item('Backlog')], [])]}
      />,
    )
    await waitFor(() => expect(resolver.getNodeById('backlog')).toBeDefined())
    expect(resolver.getNodeById('backlog')?.id).toBe('backlog')

    cleanup()
    render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={[submenu('Status', [item('Backlog')], [])]}
      />,
    )
    await waitFor(() =>
      expect(resolver.getNodeById('status/backlog')).toBeDefined(),
    )
  })

  it('reads idScope and getResolvedId once for the root lifetime', async () => {
    let resolver!: MenuTreeResolver
    const view = render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        getResolvedId={() => 'first'}
        content={[item('Backlog')]}
      />,
    )
    await waitFor(() => expect(resolver.getNodeById('first')).toBeDefined())

    view.rerender(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        idScope="menu"
        getResolvedId={() => 'second'}
        content={[item('Backlog')]}
      />,
    )
    expect(resolver.getNodeById('first')).toBeDefined()
    expect(resolver.getNodeById('second')).toBeUndefined()
  })

  describe('public getResolvedId prop', () => {
    it('uses the custom Resolved ID seam for resolver node IDs', async () => {
      let resolver!: MenuTreeResolver
      render(
        <Menu
          onResolver={(value) => {
            resolver = value
          }}
          getResolvedId={(node) => `x-${node.def.id ?? node.definitionKey}`}
          content={[item('Settings'), submenu('Status', [item('Backlog')], [])]}
        />,
      )

      await waitFor(() =>
        expect(resolver.getNodeById('x-status')).toBeDefined(),
      )
      expect(resolver.getNodeById('x-status')?.children[0]?.id).toBe(
        'x-backlog',
      )
    })
  })

  it('resolves root content with qualified definition paths', async () => {
    let resolver!: MenuTreeResolver
    render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={[
          item('Settings'),
          submenu('Status', [item('Backlog'), item('In Progress')], []),
        ]}
      />,
    )

    await waitFor(() =>
      expect(resolver.getNodeById('status/backlog')).toBeDefined(),
    )
    const node = resolver.getNodeById('status/backlog')!
    expect(node.definitionPath).toEqual(['status', 'backlog'])
    expect(node.parent?.id).toBe('status')
    expect(resolver.rootNodes).toHaveLength(2)
  })

  it('keeps node instances stable across recreated content', async () => {
    let resolver!: MenuTreeResolver
    const content = () => [
      item('Settings'),
      submenu('Status', [item('Backlog'), item('In Progress')], []),
    ]
    const view = render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={content()}
      />,
    )
    await waitFor(() =>
      expect(resolver.getNodeById('status/backlog')).toBeDefined(),
    )
    const before = resolver.getNodeById('status/backlog')
    view.rerender(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={content()}
      />,
    )
    expect(resolver.getNodeById('status/backlog')).toBe(before)
  })

  it('grafts nested-surface defs outside the static def tree', async () => {
    let resolver!: MenuTreeResolver
    const leaf = item('Leaf')
    const extra = item('Extra')
    const content = [submenu('A', [leaf], [leaf, extra])]
    const user = userEvent.setup()
    render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={content}
      />,
    )
    await waitFor(() => expect(resolver.getNodeById('a/extra')).toBeUndefined())
    await user.click(screen.getByRole('menuitem', { name: 'A' }))
    await waitFor(() => expect(resolver.getNodeById('a/extra')).toBeDefined())
    const parent = resolver.getNodeById('a')!
    expect(resolver.getNodeById('a/extra')?.parent).toBe(parent)
    expect(resolver.getNodeById('a/extra')?.definitionPath).toEqual([
      'a',
      'extra',
    ])
    expect(parent.children.filter((node) => node.id === 'a/leaf')).toHaveLength(
      1,
    )
  })

  it('grafts late defs without replacing stable siblings', async () => {
    let resolver!: MenuTreeResolver
    const leaf = item('Leaf')
    const late = item('Late')
    const user = userEvent.setup()
    let nestedContent: NodeDef[] = [leaf]
    const submenuDef = submenu('A', [leaf], () => nestedContent)
    const view = render(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={[submenuDef]}
      />,
    )
    await user.click(screen.getByRole('menuitem', { name: 'A' }))
    await waitFor(() => expect(resolver.getNodeById('a/leaf')).toBeDefined())
    const before = resolver.getNodeById('a/leaf')
    nestedContent = [leaf, late]
    view.rerender(
      <Menu
        onResolver={(value) => {
          resolver = value
        }}
        content={[submenuDef]}
      />,
    )
    await user.click(screen.getByRole('menuitem', { name: 'A' }))
    await waitFor(() => expect(resolver.getNodeById('a/late')).toBeDefined())
    expect(resolver.getNodeById('a/leaf')).toBe(before)
  })

  it('asserts browse pipeline wiring: the DOM reads the Resolved IDs computed by the resolver', async () => {
    render(
      <Menu
        onResolver={() => {}}
        content={[item('Apple'), submenu('Status', [item('Backlog')], [])]}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'id',
        'apple',
      ),
    )
    expect(screen.getByRole('menuitem', { name: 'Status' })).toHaveAttribute(
      'id',
      'status',
    )
  })

  it('asserts deep-search pipeline wiring: the DOM reads the Resolved IDs computed by the resolver', async () => {
    const user = userEvent.setup()
    render(
      <Menu
        onResolver={() => {}}
        search
        content={[item('Apple'), submenu('Status', [item('Backlog')], [])]}
      />,
    )
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'back')
    // The deep-search result reads the path-qualified id computed by the resolver.
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Backlog' })).toHaveAttribute(
        'id',
        'status/backlog',
      ),
    )
  })
})
