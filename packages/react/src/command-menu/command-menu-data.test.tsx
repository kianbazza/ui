import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  type CheckboxItemDef,
  CommandMenu,
  type DeepSearchConfig,
  type GroupDef,
  type ItemDef,
  type NodeDef,
  type RowRenderContext,
  type SubpageDef,
  useDataList,
} from './index.js'

function createItemDef(
  testId: string,
  value: string,
  options: Partial<ItemDef> = {},
): ItemDef {
  return {
    kind: 'item',
    value,
    render: ({ props, context }) => (
      <CommandMenu.Item
        {...props}
        data-deep-search-result={context.isDeepSearchResult ? '' : undefined}
        data-testid={`item-${testId}`}
      >
        {value}
      </CommandMenu.Item>
    ),
    ...options,
  }
}

function createCheckboxItemDef(
  testId: string,
  value: string,
  options: Partial<CheckboxItemDef> = {},
): CheckboxItemDef {
  return {
    kind: 'checkbox-item',
    value,
    render: ({ props }) => (
      <CommandMenu.CheckboxItem {...props} data-testid={`item-${testId}`}>
        <CommandMenu.CheckboxItemIndicator data-testid={`indicator-${testId}`}>
          Selected
        </CommandMenu.CheckboxItemIndicator>
        {value}
      </CommandMenu.CheckboxItem>
    ),
    ...options,
  }
}

function createGroupDef(id: string, label: string, nodes: NodeDef[]): GroupDef {
  return {
    kind: 'group',
    id,
    label,
    nodes,
    render: ({ children, context }) => (
      <CommandMenu.Group data-testid={`group-${id}`}>
        <CommandMenu.GroupLabel data-testid={`group-label-${id}`}>
          {context.label}
        </CommandMenu.GroupLabel>
        {children}
      </CommandMenu.Group>
    ),
  }
}

function createSubpageDef(
  id: string,
  value: string,
  nodes: NodeDef[],
): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value,
    nodes,
    renderTrigger: ({ props }) => (
      <CommandMenu.SubpageTrigger
        {...props}
        data-testid={`subpage-trigger-${id}`}
      >
        {value}
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes: childNodes, renderNode }) => (
      <CommandMenu.Subpage pageId={pageId}>
        <CommandMenu.Surface data-testid={`surface-${id}`}>
          <CommandMenu.Input
            aria-label={`Search ${value}`}
            data-testid={`input-${id}`}
          />
          <CommandMenu.List data-testid={`list-${id}`}>
            <CommandMenu.SubpageBackItem
              data-testid={`subpage-back-${id}`}
              value={`${id}-back`}
            >
              Back
            </CommandMenu.SubpageBackItem>
            {childNodes.map(renderNode)}
          </CommandMenu.List>
          <CommandMenu.Empty data-testid={`empty-${id}`}>
            No results
          </CommandMenu.Empty>
        </CommandMenu.Surface>
      </CommandMenu.Subpage>
    ),
  }
}

function DataRows() {
  const { nodes, renderNode } = useDataList()

  return <>{nodes.map(renderNode)}</>
}

function DataCommandMenu({
  deepSearch,
  nodes,
}: {
  deepSearch?: DeepSearchConfig | boolean
  nodes: NodeDef[]
}) {
  return (
    <CommandMenu.Root defaultOpen>
      <CommandMenu.Trigger data-testid="trigger">
        Open commands
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Popup data-testid="dialog">
          <CommandMenu.Surface
            content={nodes}
            data-testid="surface-root"
            deepSearch={deepSearch}
          >
            <CommandMenu.Input
              aria-label="Search commands"
              data-testid="input-root"
            />
            <CommandMenu.List data-testid="list-root">
              <DataRows />
            </CommandMenu.List>
            <CommandMenu.Empty data-testid="empty-root">
              No commands found
            </CommandMenu.Empty>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}

async function waitForRootInputFocus() {
  await waitFor(() => {
    expect(screen.getByTestId('input-root')).toHaveFocus()
  })
}

async function waitForSubpageInputFocus(id: string) {
  await waitFor(() => {
    expect(screen.getByTestId(`input-${id}`)).toHaveFocus()
  })
}

describe('CommandMenu data-first API', () => {
  it('renders data content, filters rows, and shows empty state', async () => {
    const user = userEvent.setup()
    const nodes: NodeDef[] = [
      createGroupDef('files', 'Files', [
        createItemDef('open-file', 'Open file'),
        createItemDef('copy-link', 'Copy link'),
      ]),
      createGroupDef('deployments', 'Deployments', [
        createItemDef('deploy-preview', 'Deploy preview'),
      ]),
    ]

    render(<DataCommandMenu nodes={nodes} />)

    await waitForRootInputFocus()
    expect(screen.getByTestId('group-label-files')).toBeInTheDocument()
    expect(screen.getByTestId('group-label-deployments')).toBeInTheDocument()
    expect(screen.getByTestId('item-open-file')).toBeInTheDocument()
    expect(screen.getByTestId('item-deploy-preview')).toBeInTheDocument()

    await user.type(screen.getByTestId('input-root'), 'deploy')

    await waitFor(() => {
      expect(screen.getByTestId('item-deploy-preview')).toBeInTheDocument()
      expect(screen.queryByTestId('item-open-file')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('group-label-files')).not.toBeInTheDocument()
    expect(screen.getByTestId('group-label-deployments')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-root')).not.toBeInTheDocument()

    await user.clear(screen.getByTestId('input-root'))
    await user.type(screen.getByTestId('input-root'), 'zzzz')

    await waitFor(() => {
      expect(screen.getByTestId('empty-root')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('item-deploy-preview')).not.toBeInTheDocument()
  })

  it('renders subpage defs, navigates to page content, and returns on empty Backspace', async () => {
    const user = userEvent.setup()
    const nodes: NodeDef[] = [
      createItemDef('new-file', 'New file'),
      createSubpageDef('projects', 'Projects', [
        createItemDef('alpha-project', 'Alpha project'),
      ]),
    ]

    render(<DataCommandMenu nodes={nodes} />)

    await waitForRootInputFocus()
    expect(screen.getByTestId('subpage-trigger-projects')).toBeInTheDocument()

    await user.click(screen.getByTestId('subpage-trigger-projects'))

    await waitForSubpageInputFocus('projects')
    expect(screen.getByTestId('item-alpha-project')).toBeInTheDocument()
    expect(screen.queryByTestId('list-root')).not.toBeInTheDocument()

    await user.keyboard('{Backspace}')

    await waitFor(() => {
      expect(screen.getByTestId('list-root')).toBeInTheDocument()
      expect(screen.queryByTestId('list-projects')).not.toBeInTheDocument()
    })
  })

  it('a data-first subpage with Resolved ID "__root__" opens and closes normally', async () => {
    const user = userEvent.setup()
    const subpage = createSubpageDef('__root__', 'Root ID', [
      createItemDef('root-id-item', 'Root ID item'),
    ])
    const seenPageIds: string[] = []
    const baseRenderContent = subpage.renderContent
    subpage.renderContent = (params) => {
      seenPageIds.push(params.pageId)
      return baseRenderContent(params)
    }
    const nodes: NodeDef[] = [subpage]

    render(<DataCommandMenu nodes={nodes} />)

    await waitForRootInputFocus()
    await user.click(screen.getByTestId('subpage-trigger-__root__'))

    await waitForSubpageInputFocus('__root__')
    expect(screen.getByTestId('item-root-id-item')).toBeInTheDocument()
    // The page is addressed by the branch's Resolved ID — the literal string
    // `__root__` — which is no longer a reserved sentinel.
    expect(new Set(seenPageIds)).toEqual(new Set(['__root__']))

    await user.click(screen.getByTestId('subpage-back-__root__'))

    await waitForRootInputFocus()
    expect(screen.getByTestId('list-root')).toBeInTheDocument()
  })

  it('warns once and keeps the first registration when two pages share an ID', async () => {
    const user = userEvent.setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    function DuplicatePages({ showFirst }: { showFirst: boolean }) {
      return (
        <CommandMenu.Root defaultOpen>
          <CommandMenu.Trigger data-testid="trigger">
            Open commands
          </CommandMenu.Trigger>
          <CommandMenu.Portal>
            <CommandMenu.Popup data-testid="dialog">
              <CommandMenu.Surface data-testid="surface-root">
                <CommandMenu.List>
                  <CommandMenu.SubpageTrigger
                    targetPageId="dup"
                    value="open-dup"
                    data-testid="open-dup"
                  >
                    Open duplicate
                  </CommandMenu.SubpageTrigger>
                </CommandMenu.List>
              </CommandMenu.Surface>
              {showFirst ? (
                <CommandMenu.Subpage pageId="dup">
                  <CommandMenu.Surface>
                    <CommandMenu.List>
                      <CommandMenu.SubpageBackItem
                        value="first-back"
                        data-testid="first-back"
                      >
                        Back
                      </CommandMenu.SubpageBackItem>
                      <CommandMenu.Item value="first" data-testid="first-page">
                        First page
                      </CommandMenu.Item>
                    </CommandMenu.List>
                  </CommandMenu.Surface>
                </CommandMenu.Subpage>
              ) : null}
              <CommandMenu.Subpage pageId="dup">
                <CommandMenu.Surface>
                  <CommandMenu.List>
                    <CommandMenu.Item value="second" data-testid="second-page">
                      Second page
                    </CommandMenu.Item>
                  </CommandMenu.List>
                </CommandMenu.Surface>
              </CommandMenu.Subpage>
            </CommandMenu.Popup>
          </CommandMenu.Portal>
        </CommandMenu.Root>
      )
    }

    const { rerender } = render(<DuplicatePages showFirst />)

    await user.click(screen.getByTestId('open-dup'))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('dup')
    expect(screen.getByTestId('first-page')).toBeInTheDocument()
    expect(screen.queryByTestId('second-page')).not.toBeInTheDocument()

    // When the owner unmounts, a surviving duplicate takes over the ID so the
    // page stays reachable.
    await user.click(screen.getByTestId('first-back'))
    rerender(<DuplicatePages showFirst={false} />)
    await user.click(screen.getByTestId('open-dup'))
    await waitFor(() => {
      expect(screen.getByTestId('second-page')).toBeInTheDocument()
    })

    warn.mockRestore()
  })

  it('surfaces subpage descendants as deep-search results with breadcrumbs', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const archivedContexts: RowRenderContext[] = []
    const nodes: NodeDef[] = [
      createSubpageDef('projects', 'Projects', [
        createItemDef('archived-project', 'Archived project', {
          onSelect,
          render: ({ props, context }) => {
            archivedContexts.push(context)

            return (
              <CommandMenu.Item
                {...props}
                data-testid={
                  context.isDeepSearchResult
                    ? 'item-archived-project-deep'
                    : 'item-archived-project'
                }
              >
                Archived project
              </CommandMenu.Item>
            )
          },
        }),
      ]),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'archived')

    await waitFor(() => {
      expect(
        screen.getByTestId('item-archived-project-deep'),
      ).toBeInTheDocument()
    })

    const deepContexts = archivedContexts.filter(
      (context) => context.isDeepSearchResult,
    )
    expect(deepContexts.length).toBeGreaterThan(0)
    expect(deepContexts[0]?.breadcrumbs.length).toBeGreaterThan(0)

    await user.click(screen.getByTestId('item-archived-project-deep'))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('toggles checkbox defs via onCheckedChange without closing', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()

    function CheckboxMenu() {
      const [checked, setChecked] = React.useState(false)
      const nodes = React.useMemo<NodeDef[]>(
        () => [
          createCheckboxItemDef('show-archived', 'Show archived', {
            checked,
            onCheckedChange: (nextChecked, eventDetails) => {
              setChecked(nextChecked)
              onCheckedChange(nextChecked, eventDetails)
            },
          }),
        ],
        [checked],
      )

      return <DataCommandMenu nodes={nodes} />
    }

    render(<CheckboxMenu />)

    await waitForRootInputFocus()
    await user.click(screen.getByTestId('item-show-archived'))

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    expect(screen.getByTestId('item-show-archived')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
  })
})
