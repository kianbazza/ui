import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import {
  type AsyncLoaderResult,
  CommandMenu,
  type DeepSearchConfig,
  type LoaderComponentProps,
  type NodeDef,
  type PopupMenuNode,
  type SubpageDef,
  useDataList,
} from './index.js'

function makeLoaderResult(
  overrides: Partial<AsyncLoaderResult<NodeDef[]>> = {},
): AsyncLoaderResult<NodeDef[]> {
  const status = overrides.status ?? (overrides.data ? 'success' : 'pending')
  const data = status === 'success' ? (overrides.data ?? []) : undefined

  const result: AsyncLoaderResult<NodeDef[]> =
    status === 'success'
      ? {
          data,
          source: 'vanilla',
          error: null,
          status: 'success',
          fetchStatus: 'idle',
          loadingPhase: 'none',
          isLoading: false,
          isFetching: false,
          isInitialLoading: false,
          isRefetching: false,
          isPending: false,
          isSuccess: true,
          isError: false,
          isPaused: false,
          hasData: true,
          hasFetched: true,
        }
      : {
          data: undefined,
          source: 'vanilla',
          error: null,
          status: 'pending',
          fetchStatus: 'fetching',
          loadingPhase: 'initial',
          isLoading: true,
          isFetching: true,
          isInitialLoading: true,
          isRefetching: false,
          isPending: true,
          isSuccess: false,
          isError: false,
          isPaused: false,
          hasData: false,
          hasFetched: false,
        }

  return {
    ...result,
    ...overrides,
    data,
  }
}

interface ControllableLoader {
  Loader: React.ComponentType<LoaderComponentProps>
  queries: string[]
  enabledValues: Array<boolean | undefined>
  latestQuery: () => string | undefined
  resolve: (nodes: NodeDef[]) => void
}

const renderedSubpageContent = new Set<string>()

function SubpageContentReady({ id }: { id: string }) {
  React.useEffect(() => {
    renderedSubpageContent.add(id)

    return () => {
      renderedSubpageContent.delete(id)
    }
  }, [id])

  return null
}

function createControllableLoader(options?: {
  resetOnQueryChange?: boolean
}): ControllableLoader {
  const queries: string[] = []
  const enabledValues: Array<boolean | undefined> = []
  let setLoaderResult: React.Dispatch<
    React.SetStateAction<AsyncLoaderResult<NodeDef[]>>
  > | null = null

  const Loader: React.ComponentType<LoaderComponentProps> = function Loader({
    query,
    enabled,
    children,
  }) {
    const [result, setResult] = React.useState(() => makeLoaderResult())
    const previousQueryRef = React.useRef<string | null>(null)

    React.useEffect(() => {
      setLoaderResult = setResult

      return () => {
        if (setLoaderResult === setResult) {
          setLoaderResult = null
        }
      }
    }, [])

    React.useEffect(() => {
      if (previousQueryRef.current === query) {
        return
      }

      previousQueryRef.current = query
      queries.push(query)
      enabledValues.push(enabled)

      if (options?.resetOnQueryChange) {
        setResult(makeLoaderResult())
      }
    }, [query, enabled, options?.resetOnQueryChange])

    return <>{children(result)}</>
  }

  return {
    Loader,
    queries,
    enabledValues,
    latestQuery: () => queries[queries.length - 1],
    resolve: (nodes) => {
      if (!setLoaderResult) {
        throw new Error('Loader is not mounted')
      }

      setLoaderResult(makeLoaderResult({ data: nodes, status: 'success' }))
    },
  }
}

function createItemDef(testId: string, value: string): NodeDef {
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
  }
}

function createSubpageDef({
  id,
  value,
  nodes = [],
  asyncNodes,
}: {
  id: string
  value: string
  nodes?: NodeDef[]
  asyncNodes: NonNullable<SubpageDef['asyncNodes']>
}): SubpageDef {
  return {
    kind: 'subpage',
    id,
    value,
    nodes,
    asyncNodes,
    renderTrigger: ({ props }) => (
      <CommandMenu.SubpageTrigger
        {...props}
        data-testid={`subpage-trigger-${id}`}
      >
        {value}
      </CommandMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId, nodes: childNodes, asyncContent }) => (
      <>
        <CommandMenu.Subpage pageId={pageId}>
          <CommandMenu.Surface
            asyncContent={asyncContent}
            content={childNodes}
            data-testid={`surface-${id}`}
          >
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
              <DataRows />
            </CommandMenu.List>
            <CommandMenu.Loading data-testid={`loading-${id}`}>
              Loading {value}
            </CommandMenu.Loading>
            <CommandMenu.Empty data-testid={`empty-${id}`}>
              No {value}
            </CommandMenu.Empty>
          </CommandMenu.Surface>
        </CommandMenu.Subpage>
        <SubpageContentReady id={id} />
      </>
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
            <CommandMenu.Loading data-testid="loading-root">
              Loading commands
            </CommandMenu.Loading>
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

async function waitForSubpageContentReady(id: string) {
  await waitFor(() => {
    expect(renderedSubpageContent.has(id)).toBe(true)
  })
}

async function resolveLoader(loader: ControllableLoader, nodes: NodeDef[]) {
  await act(async () => {
    loader.resolve(nodes)
  })
}

describe('CommandMenu async data-first API', () => {
  it('lazy-loads static async subpage content and suppresses Empty while loading', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'projects',
        value: 'Projects',
        asyncNodes: {
          type: 'static',
          Loader: loader.Loader,
          loadStrategy: 'lazy',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await waitForSubpageContentReady('projects')
    await user.click(screen.getByTestId('subpage-trigger-projects'))
    if (!screen.queryByTestId('input-projects')) {
      await user.click(screen.getByTestId('subpage-trigger-projects'))
    }

    await waitForSubpageInputFocus('projects')
    expect(screen.getByTestId('loading-projects')).toBeInTheDocument()

    await user.type(screen.getByTestId('input-projects'), 'zebra')

    expect(screen.getByTestId('loading-projects')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-projects')).not.toBeInTheDocument()

    await resolveLoader(loader, [
      createItemDef('zebra-project', 'Zebra project'),
    ])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-projects')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-zebra-project')).toBeInTheDocument()
    })
  })

  it('streams eager static async subpage rows into root deep search', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'reports',
        value: 'Reports',
        asyncNodes: {
          type: 'static',
          Loader: loader.Loader,
          loadStrategy: 'eager',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'orbit')

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })

    await resolveLoader(loader, [createItemDef('orbit-report', 'Orbit report')])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-root')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-orbit-report')).toBeInTheDocument()
    })

    expect(screen.getByTestId('item-orbit-report')).toHaveAttribute(
      'data-deep-search-result',
      '',
    )
  })

  it('passes root search text into query async subpage loaders and replaces results', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader({ resetOnQueryChange: true })
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'people',
        value: 'People',
        asyncNodes: {
          type: 'query',
          Loader: loader.Loader,
          minQueryLength: 1,
          initialQueryBehavior: false,
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    const input = screen.getByTestId('input-root')

    await user.type(input, 'alpha')

    await waitFor(() => {
      expect(loader.latestQuery()).toBe('alpha')
    })

    expect(loader.enabledValues[loader.enabledValues.length - 1]).toBe(true)

    await resolveLoader(loader, [createItemDef('alpha-person', 'Alpha person')])

    await waitFor(() => {
      expect(screen.getByTestId('item-alpha-person')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('empty-root')).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'beta')

    await waitFor(() => {
      expect(loader.latestQuery()).toBe('beta')
    })

    await resolveLoader(loader, [createItemDef('beta-person', 'Beta person')])

    await waitFor(() => {
      expect(screen.getByTestId('item-beta-person')).toBeInTheDocument()
      expect(screen.queryByTestId('item-alpha-person')).not.toBeInTheDocument()
    })
  })

  it('blocks async deep-search rows until every async subpage loader resolves', async () => {
    const user = userEvent.setup()
    const firstLoader = createControllableLoader()
    const secondLoader = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'first',
        value: 'First page',
        asyncNodes: {
          type: 'static',
          Loader: firstLoader.Loader,
          loadStrategy: 'eager',
        },
      }),
      createSubpageDef({
        id: 'second',
        value: 'Second page',
        asyncNodes: {
          type: 'static',
          Loader: secondLoader.Loader,
          loadStrategy: 'eager',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{
          enabled: true,
          minLength: 1,
          asyncResultBehavior: 'block',
        }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'result')

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('item-alpha-result')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-beta-result')).not.toBeInTheDocument()

    await resolveLoader(firstLoader, [
      createItemDef('alpha-result', 'Alpha result'),
    ])

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('item-alpha-result')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-beta-result')).not.toBeInTheDocument()

    await resolveLoader(secondLoader, [
      createItemDef('beta-result', 'Beta result'),
    ])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-root')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-alpha-result')).toBeInTheDocument()
      expect(screen.getByTestId('item-beta-result')).toBeInTheDocument()
    })
  })

  it('settles within a bounded number of renders when a root loader and a branch loader resolve together', async () => {
    const user = userEvent.setup()
    const rootLoader = createControllableLoader()
    const branchLoader = createControllableLoader()
    let renderCount = 0

    const projects = createSubpageDef({
      id: 'projects',
      value: 'Projects',
      asyncNodes: {
        type: 'static',
        Loader: branchLoader.Loader,
        loadStrategy: 'eager',
      },
    })
    const nodes: NodeDef[] = [createItemDef('static', 'Static item'), projects]

    render(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Trigger data-testid="trigger">
          Open commands
        </CommandMenu.Trigger>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="dialog">
            <CommandMenu.Surface
              asyncContent={{
                type: 'static',
                Loader: rootLoader.Loader,
                loadStrategy: 'eager',
              }}
              content={nodes}
              data-testid="surface-root"
              deepSearch={{ enabled: true, minLength: 0 }}
            >
              <CommandMenu.Input
                aria-label="Search commands"
                data-testid="input-root"
              />
              <React.Profiler
                id="guard"
                onRender={() => {
                  renderCount += 1
                }}
              >
                <CommandMenu.List data-testid="list-root">
                  <DataRows />
                </CommandMenu.List>
              </React.Profiler>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )

    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'loaded')

    // The root result keeps the authored branch so the branch graft has a
    // target; both loaders resolve in the same commit.
    await act(async () => {
      rootLoader.resolve([
        createItemDef('root-loaded', 'Root loaded'),
        projects,
      ])
      branchLoader.resolve([createItemDef('branch-loaded', 'Branch loaded')])
    })

    await waitFor(() => {
      expect(screen.getByTestId('item-root-loaded')).toBeInTheDocument()
      expect(screen.getByTestId('item-branch-loaded')).toBeInTheDocument()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(renderCount).toBeLessThan(20)
  })

  it('withdraws grafted branch rows when the loader result is reset', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader({ resetOnQueryChange: true })
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'people',
        value: 'People',
        nodes: [createItemDef('static-person', 'Alpha static person')],
        asyncNodes: {
          type: 'query',
          Loader: loader.Loader,
          minQueryLength: 1,
          initialQueryBehavior: false,
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )

    await waitForRootInputFocus()
    const input = screen.getByTestId('input-root')
    await user.type(input, 'alpha')
    await waitFor(() => {
      expect(loader.latestQuery()).toBe('alpha')
    })

    await resolveLoader(loader, [createItemDef('alpha-person', 'Alpha person')])
    await waitFor(() => {
      expect(screen.getByTestId('item-alpha-person')).toBeInTheDocument()
      expect(screen.getByTestId('item-static-person')).toBeInTheDocument()
    })

    // A query change resets the loader to pending; its previous result must
    // leave the Menu Tree while the authored static child stays.
    await user.type(input, ' s')
    await waitFor(() => {
      expect(loader.latestQuery()).toBe('alpha s')
    })
    await waitFor(() => {
      expect(screen.queryByTestId('item-alpha-person')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('item-static-person')).toBeInTheDocument()
  })

  it('renders a structurally different `content` array on the next render', async () => {
    const alpha = createItemDef('alpha', 'Alpha')
    const beta = createItemDef('beta', 'Beta')

    const { rerender } = render(<DataCommandMenu nodes={[alpha]} />)
    await waitForRootInputFocus()
    expect(screen.getByTestId('item-alpha')).toBeInTheDocument()

    rerender(<DataCommandMenu nodes={[alpha, beta]} />)
    await waitFor(() => {
      expect(screen.getByTestId('item-beta')).toBeInTheDocument()
    })

    rerender(<DataCommandMenu nodes={[beta]} />)
    await waitFor(() => {
      expect(screen.queryByTestId('item-alpha')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('item-beta')).toBeInTheDocument()
  })

  it('hands a subpage callback only static children, even after its loader replaces them', async () => {
    const user = userEvent.setup()
    const loader = createControllableLoader()
    const staticProject = createItemDef('static-project', 'Static project')
    const subpage = createSubpageDef({
      id: 'projects',
      value: 'Projects',
      nodes: [staticProject],
      asyncNodes: {
        type: 'static',
        Loader: loader.Loader,
        loadStrategy: 'lazy',
      },
    })
    // Render the callback's `nodes` directly (as a custom `renderContent`
    // may) in addition to the surface's own rows, and record what it was
    // handed on every render.
    const seenNodes: PopupMenuNode[][] = []
    subpage.renderContent = ({ pageId, asyncContent, nodes, renderNode }) => {
      seenNodes.push(nodes)
      return (
        <>
          <CommandMenu.Subpage pageId={pageId}>
            <CommandMenu.Surface
              asyncContent={asyncContent}
              content={nodes}
              data-testid="surface-projects"
            >
              <CommandMenu.Input
                aria-label="Search Projects"
                data-testid="input-projects"
              />
              <CommandMenu.List data-testid="list-projects">
                <CommandMenu.SubpageBackItem
                  data-testid="subpage-back-projects"
                  value="projects-back"
                >
                  Back
                </CommandMenu.SubpageBackItem>
                {nodes.map(renderNode)}
                <DataRows />
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Subpage>
          <SubpageContentReady id="projects" />
        </>
      )
    }
    const nodes: NodeDef[] = [subpage]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 999 }}
        nodes={nodes}
      />,
    )
    await waitForRootInputFocus()
    await waitForSubpageContentReady('projects')
    await user.click(screen.getByTestId('subpage-trigger-projects'))
    if (!screen.queryByTestId('input-projects')) {
      await user.click(screen.getByTestId('subpage-trigger-projects'))
    }
    await waitForSubpageInputFocus('projects')
    // Once via `DataRows`, once via the direct `renderNode` call.
    expect(screen.getAllByTestId('item-static-project')).toHaveLength(2)
    expect(seenNodes.at(-1)?.map((n) => n.def)).toEqual([staticProject])

    // `asyncContent` replaces the static children under the subpage branch:
    // the callback's `nodes` never contains loader results, and is empty once
    // the static children have left the tree.
    await resolveLoader(loader, [
      createItemDef('loaded-project', 'Loaded project'),
    ])
    await waitFor(() => {
      expect(screen.getByTestId('item-loaded-project')).toBeInTheDocument()
      expect(
        screen.queryByTestId('item-static-project'),
      ).not.toBeInTheDocument()
    })
    for (const seen of seenNodes) {
      expect(seen.every((n) => n.def === staticProject)).toBe(true)
    }
    expect(seenNodes.at(-1)).toEqual([])
  })

  it('same-value branches with distinct authored IDs receive distinct loader results', async () => {
    const user = userEvent.setup()
    const loaderA = createControllableLoader()
    const loaderB = createControllableLoader()
    const nodes: NodeDef[] = [
      createSubpageDef({
        id: 'a',
        value: 'Status',
        asyncNodes: {
          type: 'static',
          Loader: loaderA.Loader,
          loadStrategy: 'eager',
        },
      }),
      createSubpageDef({
        id: 'b',
        value: 'Status',
        asyncNodes: {
          type: 'static',
          Loader: loaderB.Loader,
          loadStrategy: 'eager',
        },
      }),
    ]

    render(
      <DataCommandMenu
        deepSearch={{ enabled: true, minLength: 1 }}
        nodes={nodes}
      />,
    )
    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'result')

    await resolveLoader(loaderA, [createItemDef('a-result', 'A result')])
    await resolveLoader(loaderB, [createItemDef('b-result', 'B result')])

    await waitFor(() => {
      expect(screen.getByTestId('item-a-result')).toBeInTheDocument()
      expect(screen.getByTestId('item-b-result')).toBeInTheDocument()
    })
    // Each result is grafted under its own branch: the deep-search row IDs are
    // qualified by the authored branch id, not the shared value.
    expect(screen.getByTestId('item-a-result').id).toBe('a/a-result')
    expect(screen.getByTestId('item-b-result').id).toBe('b/b-result')
    expect(screen.getAllByTestId('item-a-result')).toHaveLength(1)
    expect(screen.getAllByTestId('item-b-result')).toHaveLength(1)
  })

  it('a branch with Resolved ID "__root__" and a root loader coexist', async () => {
    const user = userEvent.setup()
    const rootLoader = createControllableLoader()
    const branchLoader = createControllableLoader()
    const rootBranch = createSubpageDef({
      id: '__root__',
      value: 'Root-ish',
      asyncNodes: {
        type: 'static',
        Loader: branchLoader.Loader,
        loadStrategy: 'eager',
      },
    })

    render(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Trigger data-testid="trigger">
          Open commands
        </CommandMenu.Trigger>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="dialog">
            <CommandMenu.Surface
              asyncContent={{
                type: 'static',
                Loader: rootLoader.Loader,
                loadStrategy: 'eager',
              }}
              content={[rootBranch]}
              data-testid="surface-root"
              deepSearch={{ enabled: true, minLength: 1 }}
            >
              <CommandMenu.Input
                aria-label="Search commands"
                data-testid="input-root"
              />
              <CommandMenu.List data-testid="list-root">
                <DataRows />
              </CommandMenu.List>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )
    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'result')

    // The root result keeps the branch so the branch loader has a target.
    await act(async () => {
      rootLoader.resolve([
        createItemDef('root-result', 'Root result'),
        rootBranch,
      ])
      branchLoader.resolve([createItemDef('branch-result', 'Branch result')])
    })

    await waitFor(() => {
      expect(screen.getByTestId('item-root-result')).toBeInTheDocument()
      expect(screen.getByTestId('item-branch-result')).toBeInTheDocument()
    })
  })

  it('block mode unblocks when a root-only loader resolves', async () => {
    const user = userEvent.setup()
    const rootLoader = createControllableLoader()

    render(
      <CommandMenu.Root defaultOpen>
        <CommandMenu.Trigger data-testid="trigger">
          Open commands
        </CommandMenu.Trigger>
        <CommandMenu.Portal>
          <CommandMenu.Popup data-testid="dialog">
            <CommandMenu.Surface
              asyncContent={{
                type: 'static',
                Loader: rootLoader.Loader,
                loadStrategy: 'eager',
              }}
              content={[]}
              data-testid="surface-root"
              deepSearch={{
                enabled: true,
                minLength: 1,
                asyncResultBehavior: 'block',
              }}
            >
              <CommandMenu.Input
                aria-label="Search commands"
                data-testid="input-root"
              />
              <CommandMenu.List data-testid="list-root">
                <DataRows />
              </CommandMenu.List>
              <CommandMenu.Loading data-testid="loading-root">
                Loading commands
              </CommandMenu.Loading>
            </CommandMenu.Surface>
          </CommandMenu.Popup>
        </CommandMenu.Portal>
      </CommandMenu.Root>,
    )
    await waitForRootInputFocus()
    await user.type(screen.getByTestId('input-root'), 'result')

    await waitFor(() => {
      expect(screen.getByTestId('loading-root')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('item-root-result')).not.toBeInTheDocument()

    await resolveLoader(rootLoader, [
      createItemDef('root-result', 'Root result'),
    ])

    await waitFor(() => {
      expect(screen.queryByTestId('loading-root')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-root-result')).toBeInTheDocument()
    })
  })
})
