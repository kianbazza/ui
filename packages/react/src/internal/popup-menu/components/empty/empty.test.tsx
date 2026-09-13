import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '../../../../dropdown-menu/index.js'
import {
  createVanillaQueryLoader,
  createVanillaStaticLoader,
} from '../../../../loaders/vanilla.js'
import type {
  AsyncNodesConfig,
  ItemDef,
  NodeDef,
  SubmenuDef,
} from '../../data-first/types.js'

// ============================================================================
// Test Helpers
// ============================================================================

function createItemDef(value: string, keywords?: string[]): ItemDef {
  return {
    kind: 'item',
    value,
    keywords,
    render: ({ props }) => (
      <DropdownMenu.Item {...props} data-testid={`item-${value.toLowerCase()}`}>
        {value}
      </DropdownMenu.Item>
    ),
  }
}

function createSubmenuDef(
  id: string,
  value: string,
  nodes: NodeDef[],
  options?: {
    asyncNodes?: AsyncNodesConfig
    includeInDeepSearch?: SubmenuDef['includeInDeepSearch']
  },
): SubmenuDef {
  const { asyncNodes, includeInDeepSearch = true } = options ?? {}

  return {
    kind: 'submenu',
    id,
    value,
    nodes,
    asyncNodes,
    deepSearch: true,
    includeInDeepSearch,
    render: ({ props, nodes: childNodes, renderNode }) => (
      <DropdownMenu.Submenu>
        <DropdownMenu.SubmenuTrigger {...props}>
          {value}
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner>
            <DropdownMenu.Popup>
              <DropdownMenu.Surface>
                <DropdownMenu.List>
                  {childNodes.map(renderNode)}
                </DropdownMenu.List>
              </DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

function LoadingEmptyListItems() {
  const { nodes, renderNode } = DropdownMenu.useDataList()

  return (
    <>
      <DropdownMenu.Loading data-testid="loading">
        Loading...
      </DropdownMenu.Loading>
      <DropdownMenu.Empty data-testid="empty">No results</DropdownMenu.Empty>
      {nodes.map((node) => renderNode(node))}
    </>
  )
}

/**
 * Deferred promise helper for controlling async resolution in tests.
 */
function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// ============================================================================
// Basic (non-async) Tests
// ============================================================================

describe('Empty and Loading visibility', () => {
  describe('basic (non-async)', () => {
    function BasicMenu({
      normalizeSearch,
    }: {
      normalizeSearch?: (search: string) => string
    } = {}) {
      const content: NodeDef[] = React.useMemo(
        () => [
          createItemDef('Apple'),
          createItemDef('Banana'),
          createItemDef('Cherry'),
        ],
        [],
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
                  deepSearch={{ enabled: true, minLength: 0 }}
                  normalizeSearch={normalizeSearch}
                >
                  <DropdownMenu.Input
                    data-testid="search-input"
                    placeholder="Search..."
                  />
                  <DropdownMenu.List>
                    <LoadingEmptyListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    it('does not show Empty when items are visible', async () => {
      render(<BasicMenu />)

      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    it('does not show Loading without async content', async () => {
      render(<BasicMenu />)

      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('shows Empty when search matches nothing', async () => {
      const user = userEvent.setup()
      render(<BasicMenu />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'zzzzz')

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument()
      })
    })

    it('does not show Loading when search matches nothing (no async)', async () => {
      const user = userEvent.setup()
      render(<BasicMenu />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'zzzzz')

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('hides Empty when search is cleared after no results', async () => {
      const user = userEvent.setup()
      render(<BasicMenu />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'zzzzz')

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument()
      })

      await user.clear(input)

      await waitFor(() => {
        expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
    })

    it('respects custom normalizeSearch behavior', async () => {
      const user = userEvent.setup()
      render(<BasicMenu normalizeSearch={(query) => query} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')
      await user.type(input, 'Apple ')

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Async Tests
  // ============================================================================

  describe('async', () => {
    function AsyncMenu({ fetcher }: { fetcher: () => Promise<NodeDef[]> }) {
      const loader = React.useMemo(
        () => createVanillaStaticLoader({ fetcher }),
        [fetcher],
      )

      return (
        <DropdownMenu.Root defaultOpen>
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Surface
                  data-testid="surface"
                  asyncContent={loader}
                  deepSearch={{ enabled: true, minLength: 0 }}
                >
                  <DropdownMenu.Input
                    data-testid="search-input"
                    placeholder="Search..."
                  />
                  <DropdownMenu.List>
                    <LoadingEmptyListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    it('shows Loading while fetching', async () => {
      const deferred = createDeferred<NodeDef[]>()

      render(<AsyncMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })
    })

    it('does not show Empty while loading', async () => {
      const deferred = createDeferred<NodeDef[]>()

      render(<AsyncMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    it('hides Loading after data resolves', async () => {
      const deferred = createDeferred<NodeDef[]>()
      const items = [createItemDef('Apple'), createItemDef('Banana')]

      render(<AsyncMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      deferred.resolve(items)

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('item-apple')).toBeInTheDocument()
    })

    it('shows Empty after loading resolves with no matching results', async () => {
      const user = userEvent.setup()
      const items = [createItemDef('Apple'), createItemDef('Banana')]

      render(<AsyncMenu fetcher={async () => items} />)

      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      })

      // Search for something that doesn't match
      await user.type(screen.getByTestId('search-input'), 'zzzzz')

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('hides Loading after error', async () => {
      const deferred = createDeferred<NodeDef[]>()

      render(<AsyncMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      deferred.reject(new Error('Network error'))

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Async Deep Search Tests
  // ============================================================================

  describe('async deep search', () => {
    function AsyncDeepSearchMenu({
      fetcher,
    }: {
      fetcher: (
        query: string,
        options?: { signal?: AbortSignal },
      ) => Promise<NodeDef[]>
    }) {
      const loader = React.useMemo(
        () =>
          createVanillaQueryLoader({
            fetcher,
            minQueryLength: 1,
            initialQueryBehavior: false,
          }),
        [fetcher],
      )

      const content: NodeDef[] = React.useMemo(
        () => [
          createSubmenuDef('fruits', 'Fruits', [
            createItemDef('Apple'),
            createItemDef('Banana'),
          ]),
        ],
        [],
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
                  asyncContent={loader}
                  deepSearch={{ enabled: true, minLength: 0 }}
                >
                  <DropdownMenu.Input
                    data-testid="search-input"
                    placeholder="Search..."
                  />
                  <DropdownMenu.List>
                    <LoadingEmptyListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    function AsyncDeepSearchMultiLoaderMenu({
      firstFetcher,
      secondFetcher,
      asyncResultBehavior,
    }: {
      firstFetcher: () => Promise<NodeDef[]>
      secondFetcher: () => Promise<NodeDef[]>
      asyncResultBehavior?: 'stream' | 'block'
    }) {
      const firstLoader = React.useMemo(
        () => createVanillaStaticLoader({ fetcher: firstFetcher }),
        [firstFetcher],
      )
      const secondLoader = React.useMemo(
        () => createVanillaStaticLoader({ fetcher: secondFetcher }),
        [secondFetcher],
      )

      const content: NodeDef[] = React.useMemo(
        () => [
          createSubmenuDef('first', 'First', [], {
            asyncNodes: firstLoader,
            includeInDeepSearch: true,
          }),
          createSubmenuDef('second', 'Second', [], {
            asyncNodes: secondLoader,
            includeInDeepSearch: true,
          }),
        ],
        [firstLoader, secondLoader],
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
                  deepSearch={{
                    enabled: true,
                    minLength: 1,
                    asyncResultBehavior,
                  }}
                >
                  <DropdownMenu.Input
                    data-testid="search-input"
                    placeholder="Search..."
                  />
                  <DropdownMenu.List>
                    <LoadingEmptyListItems />
                  </DropdownMenu.List>
                </DropdownMenu.Surface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )
    }

    it('shows Loading while query-dependent fetcher is in-flight', async () => {
      const user = userEvent.setup()
      const deferred = createDeferred<NodeDef[]>()

      render(<AsyncDeepSearchMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'test')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })
    })

    it('does not show Empty while query-dependent fetcher is loading', async () => {
      const user = userEvent.setup()
      const deferred = createDeferred<NodeDef[]>()

      render(<AsyncDeepSearchMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'zzzzz')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    it('shows Empty after query resolves with no matching results', async () => {
      const user = userEvent.setup()

      render(<AsyncDeepSearchMenu fetcher={async () => []} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Type something that won't match static items either
      await user.type(screen.getByTestId('search-input'), 'zzzzz')

      await waitFor(() => {
        expect(screen.getByTestId('empty')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('hides Loading and shows items after query resolves with results', async () => {
      const user = userEvent.setup()
      const deferred = createDeferred<NodeDef[]>()

      render(<AsyncDeepSearchMenu fetcher={() => deferred.promise} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'mango')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      deferred.resolve([createItemDef('Mango')])

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
        expect(screen.getByTestId('item-mango')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    it('does not show Empty during re-fetch on query change', async () => {
      const user = userEvent.setup()
      let callCount = 0
      const deferred1 = createDeferred<NodeDef[]>()
      const deferred2 = createDeferred<NodeDef[]>()

      const fetcher = vi.fn(() => {
        callCount++
        return callCount === 1 ? deferred1.promise : deferred2.promise
      })

      render(<AsyncDeepSearchMenu fetcher={fetcher} />)

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const input = screen.getByTestId('search-input')

      // First query
      await user.type(input, 'a')

      deferred1.resolve([createItemDef('Avocado')])

      await waitFor(() => {
        expect(screen.getByTestId('item-avocado')).toBeInTheDocument()
      })

      // Clear and type new query -- triggers re-fetch
      await user.clear(input)
      await user.type(input, 'zzzzz')

      // During loading, should show Loading but NOT Empty
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('empty')).not.toBeInTheDocument()
    })

    it('streams async batches in append-only order by default', async () => {
      const user = userEvent.setup()
      const firstDeferred = createDeferred<NodeDef[]>()
      const secondDeferred = createDeferred<NodeDef[]>()

      render(
        <AsyncDeepSearchMultiLoaderMenu
          firstFetcher={() => firstDeferred.promise}
          secondFetcher={() => secondDeferred.promise}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'apple')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      firstDeferred.resolve([createItemDef('Pineapple')])

      await waitFor(() => {
        expect(screen.getByTestId('item-pineapple')).toBeInTheDocument()
      })

      secondDeferred.resolve([createItemDef('Apple')])

      await waitFor(() => {
        expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      })

      const pineapple = screen.getByTestId('item-pineapple')
      const apple = screen.getByTestId('item-apple')

      expect(
        pineapple.compareDocumentPosition(apple) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('blocks deep-search rows until all async loaders resolve when configured', async () => {
      const user = userEvent.setup()
      const firstDeferred = createDeferred<NodeDef[]>()
      const secondDeferred = createDeferred<NodeDef[]>()

      render(
        <AsyncDeepSearchMultiLoaderMenu
          firstFetcher={() => firstDeferred.promise}
          secondFetcher={() => secondDeferred.promise}
          asyncResultBehavior="block"
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('search-input'), 'apple')

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('item-pineapple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()

      firstDeferred.resolve([createItemDef('Pineapple')])

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('item-pineapple')).not.toBeInTheDocument()
      expect(screen.queryByTestId('item-apple')).not.toBeInTheDocument()

      secondDeferred.resolve([createItemDef('Apple')])

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
        expect(screen.getByTestId('item-pineapple')).toBeInTheDocument()
        expect(screen.getByTestId('item-apple')).toBeInTheDocument()
      })

      const apple = screen.getByTestId('item-apple')
      const pineapple = screen.getByTestId('item-pineapple')

      expect(
        apple.compareDocumentPosition(pineapple) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })
  })
})
