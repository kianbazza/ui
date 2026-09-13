import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import type { NodeDef, TreeItemDef } from '../types.js'

function ListItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()

  return <>{nodes.map(renderNode)}</>
}

function treeItem(
  value: string,
  nodes: TreeItemDef['nodes'] = [],
  options: Partial<TreeItemDef> = {},
): TreeItemDef {
  return {
    kind: 'tree-item',
    value,
    nodes,
    render: ({ props, context }) => (
      <DropdownMenu.TreeItem
        {...props}
        depth={context.tree?.depth}
        data-testid={`tree-${value}`}
        data-depth={context.tree?.depth}
        data-header={context.tree?.header ? '' : undefined}
      >
        {context.isDeepSearchResult
          ? [
              ...context.breadcrumbs.map((breadcrumb) => breadcrumb.value),
              value,
            ].join(' > ')
          : value}
      </DropdownMenu.TreeItem>
    ),
    ...options,
  }
}

function createContent(
  onSelectDesignTeam?: () => void,
  onSelectArchive?: () => void,
): NodeDef[] {
  return [
    {
      kind: 'group',
      id: 'teams',
      label: 'Your teams',
      nodes: [
        treeItem('Product & Engineering', [
          treeItem('Core builder team'),
          treeItem('Design team', [], { onSelect: onSelectDesignTeam }),
        ]),
        treeItem('Archive', [treeItem('Old team')], {
          selectable: false,
          onSelect: onSelectArchive,
        }),
      ],
    },
    {
      kind: 'item',
      value: 'Settings',
      render: ({ props }) => (
        <DropdownMenu.Item {...props} data-testid="item-Settings">
          Settings
        </DropdownMenu.Item>
      ),
    },
  ]
}

function TreeMenu({
  onSelectDesignTeam,
  onSelectArchive,
}: {
  onSelectDesignTeam?: () => void
  onSelectArchive?: () => void
}) {
  const content = React.useMemo(
    () => createContent(onSelectDesignTeam, onSelectArchive),
    [onSelectDesignTeam, onSelectArchive],
  )

  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              data-testid="surface"
              content={content}
              deepSearch={{ enabled: true, minLength: 1 }}
            >
              <DropdownMenu.Input data-testid="search-input" />
              <DropdownMenu.List>
                <ListItems />
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

describe('data-first tree rows', () => {
  it('renders browse rows in depth-first order with tree metadata', async () => {
    render(<TreeMenu />)

    await waitFor(() => {
      expect(
        screen.getByTestId('tree-Product & Engineering'),
      ).toBeInTheDocument()
    })

    expect(
      screen.getAllByRole('option').map((item) => item.textContent),
    ).toEqual([
      'Product & Engineering',
      'Core builder team',
      'Design team',
      'Archive',
      'Old team',
      'Settings',
    ])
    expect(screen.getByTestId('tree-Core builder team')).toHaveAttribute(
      'data-depth',
      '1',
    )
    expect(screen.getByTestId('tree-Archive')).toHaveAttribute(
      'data-header',
      '',
    )
  })

  it('includes headers in keyboard navigation without activating them', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onArchiveSelect = vi.fn()
    render(
      <TreeMenu
        onSelectDesignTeam={onSelect}
        onSelectArchive={onArchiveSelect}
      />,
    )
    const input = await screen.findByTestId('search-input')

    await waitFor(() => {
      expect(screen.getByTestId('tree-Product & Engineering')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })

    for (const [index, value] of [
      'Core builder team',
      'Design team',
      'Archive',
      'Old team',
      'Settings',
    ].entries()) {
      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(
          screen.getByTestId(
            value === 'Settings' ? 'item-Settings' : `tree-${value}`,
          ),
        ).toHaveAttribute('data-highlighted', '')
      })
      expect(index).toBeLessThan(5)
    }

    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowUp}')
    await waitFor(() => {
      expect(screen.getByTestId('tree-Archive')).toHaveAttribute(
        'data-highlighted',
        '',
      )
    })
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('surface')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
    expect(onArchiveSelect).not.toHaveBeenCalled()
    expect(input).toBeInTheDocument()
  })

  it('deep-searches descendants with breadcrumbs and ancestor cascade', async () => {
    const user = userEvent.setup()
    render(<TreeMenu />)
    const input = await screen.findByTestId('search-input')

    await user.type(input, 'design')
    await waitFor(() => {
      expect(screen.getByTestId('tree-Design team')).toHaveTextContent(
        'Product & Engineering > Design team',
      )
    })
    expect(screen.queryByTestId('tree-Archive')).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('tree-Core builder team'),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-Settings')).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'product')
    await waitFor(() => {
      expect(
        screen.getByTestId('tree-Product & Engineering'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('tree-Core builder team')).toHaveTextContent(
        'Product & Engineering > Core builder team',
      )
      expect(screen.getByTestId('tree-Design team')).toHaveTextContent(
        'Product & Engineering > Design team',
      )
    })

    await user.clear(input)
    await user.type(input, 'old')
    await waitFor(() => {
      expect(screen.getByTestId('tree-Old team')).toHaveTextContent(
        'Archive > Old team',
      )
    })
    expect(screen.queryByTestId('tree-Archive')).not.toBeInTheDocument()
  })

  it('selects a tree child by click and closes the menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<TreeMenu onSelectDesignTeam={onSelect} />)

    await user.click(await screen.findByTestId('tree-Design team'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByTestId('surface')).not.toBeInTheDocument()
    })
  })
})
