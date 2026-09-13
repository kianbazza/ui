import { act, render, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type {
  AsyncLoaderResult,
  ItemDef,
  LoaderComponentProps,
  NodeDef,
} from '../internal/popup-menu/data-first/types.js'
import {
  createVanillaQueryLoader,
  createVanillaStaticLoader,
} from './vanilla.js'

// ============================================================================
// Test Helpers
// ============================================================================

function createNodeDef(id: string, value: string): ItemDef {
  return {
    kind: 'item',
    id,
    value,
    render: ({ props }) => <div {...props}>{value}</div>,
  }
}

const MOCK_NODES: ItemDef[] = [
  createNodeDef('apple', 'Apple'),
  createNodeDef('banana', 'Banana'),
  createNodeDef('cherry', 'Cherry'),
]

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

/**
 * Captures the latest AsyncLoaderResult from a Loader component.
 */
function createResultCapture() {
  const results: AsyncLoaderResult<NodeDef[]>[] = []
  const spy = (state: AsyncLoaderResult<NodeDef[]>): React.ReactNode => {
    results.push(state)
    return null
  }
  return {
    spy,
    get latest() {
      return results[results.length - 1]
    },
    get all() {
      return results
    },
  }
}

/**
 * Renders a Loader component and returns a capture object + rerender/unmount.
 */
function renderLoader(
  Loader: React.ComponentType<LoaderComponentProps>,
  query = '',
) {
  const capture = createResultCapture()

  function TestHarness({ q }: { q: string }) {
    return <Loader query={q}>{capture.spy}</Loader>
  }

  const { rerender, unmount } = render(<TestHarness q={query} />)

  return {
    capture,
    rerender: (newQuery: string) => rerender(<TestHarness q={newQuery} />),
    unmount,
  }
}

// ============================================================================
// createVanillaStaticLoader
// ============================================================================

describe('createVanillaStaticLoader', () => {
  it('returns a config with type "static"', () => {
    const config = createVanillaStaticLoader({
      fetcher: async () => MOCK_NODES,
    })

    expect(config.type).toBe('static')
    expect(config.Loader).toBeDefined()
  })

  it('starts in a loading state', () => {
    const deferred = createDeferred<NodeDef[]>()
    const config = createVanillaStaticLoader({
      fetcher: () => deferred.promise,
    })

    const { capture } = renderLoader(config.Loader)

    expect(capture.latest.isLoading).toBe(true)
    expect(capture.latest.data).toBeUndefined()
    expect(capture.latest.isError).toBe(false)
    expect(capture.latest.error).toBeNull()
  })

  it('resolves with fetched data', async () => {
    const config = createVanillaStaticLoader({
      fetcher: async () => MOCK_NODES,
    })

    const { capture } = renderLoader(config.Loader)

    await waitFor(() => {
      expect(capture.latest.isLoading).toBe(false)
      expect(capture.latest.data).toEqual(MOCK_NODES)
      expect(capture.latest.isError).toBe(false)
    })
  })

  it('handles fetch errors with Error objects', async () => {
    const error = new Error('Network failure')
    const config = createVanillaStaticLoader({
      fetcher: async () => {
        throw error
      },
    })

    const { capture } = renderLoader(config.Loader)

    await waitFor(() => {
      expect(capture.latest.isLoading).toBe(false)
      expect(capture.latest.isError).toBe(true)
      expect(capture.latest.error).toBe(error)
      expect(capture.latest.data).toBeUndefined()
    })
  })

  it('handles fetch errors with non-Error values', async () => {
    const config = createVanillaStaticLoader({
      fetcher: async () => {
        throw 'string error'
      },
    })

    const { capture } = renderLoader(config.Loader)

    await waitFor(() => {
      expect(capture.latest.isError).toBe(true)
      expect(capture.latest.error).toBeInstanceOf(Error)
      expect(capture.latest.error?.message).toBe('string error')
    })
  })

  it('provides a refetch function', async () => {
    let callCount = 0
    const config = createVanillaStaticLoader({
      fetcher: async () => {
        callCount++
        return MOCK_NODES
      },
    })

    const { capture } = renderLoader(config.Loader)

    await waitFor(() => {
      expect(capture.latest.isLoading).toBe(false)
    })

    expect(callCount).toBe(1)

    act(() => {
      capture.latest.refetch?.()
    })

    await waitFor(() => {
      expect(callCount).toBe(2)
    })
  })

  it('fetches only once regardless of query prop changes', async () => {
    const fetcher = vi.fn(async () => MOCK_NODES)
    const config = createVanillaStaticLoader({ fetcher })

    const { capture, rerender } = renderLoader(config.Loader, '')

    await waitFor(() => {
      expect(capture.latest.isLoading).toBe(false)
    })

    expect(fetcher).toHaveBeenCalledTimes(1)

    // Changing query should NOT trigger a refetch for static loaders
    rerender('new query')

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// createVanillaQueryLoader
// ============================================================================

describe('createVanillaQueryLoader', () => {
  // --------------------------------------------------------------------------
  // Config shape
  // --------------------------------------------------------------------------

  describe('config shape', () => {
    it('returns a config with type "query"', () => {
      const config = createVanillaQueryLoader({
        fetcher: async () => MOCK_NODES,
      })

      expect(config.type).toBe('query')
      expect(config.Loader).toBeDefined()
    })

    it('passes through all config options', () => {
      const placeholders: ItemDef[] = [createNodeDef('ph', 'Placeholder')]

      const config = createVanillaQueryLoader({
        fetcher: async () => MOCK_NODES,
        minQueryLength: 3,
        initialQueryBehavior: {
          value: 'init',
          loadWhen: 'parent-open',
        },
        belowMinBehavior: 'placeholder',
        placeholderNodes: placeholders,
      })

      expect(config.minQueryLength).toBe(3)
      expect(config.initialQueryBehavior).toEqual({
        value: 'init',
        loadWhen: 'parent-open',
      })
      expect(config.belowMinBehavior).toBe('placeholder')
      expect(config.placeholderNodes).toBe(placeholders)
    })

    it('uses default values for optional config', () => {
      const config = createVanillaQueryLoader({
        fetcher: async () => MOCK_NODES,
      })

      expect(config.minQueryLength).toBe(1)
      expect(config.belowMinBehavior).toBe('empty')
      expect(config.initialQueryBehavior).toEqual({
        value: '',
        loadWhen: 'needed',
      })
    })
  })

  // --------------------------------------------------------------------------
  // Re-fetching on query changes
  // --------------------------------------------------------------------------

  describe('re-fetching on query changes', () => {
    it('fetches when query meets minQueryLength', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 2 })

      const { capture } = renderLoader(config.Loader, 'ab')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toEqual(MOCK_NODES)
      })

      expect(fetcher).toHaveBeenCalledWith('ab', expect.any(Object))
    })

    it('does not fetch when query is below minQueryLength and initial query is disabled', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({
        fetcher,
        minQueryLength: 3,
        initialQueryBehavior: false,
      })

      const { capture } = renderLoader(config.Loader, 'ab')

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(capture.latest.isLoading).toBe(false)
      expect(capture.latest.data).toBeUndefined()
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('fetches with empty query by default when no user query is provided', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 3 })

      const { capture } = renderLoader(config.Loader, '')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toEqual(MOCK_NODES)
      })

      expect(fetcher).toHaveBeenCalledWith('', expect.any(Object))
    })

    it('re-fetches when query changes', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })

      const { capture, rerender } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(fetcher).toHaveBeenCalledWith('a', expect.any(Object))

      rerender('b')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      expect(fetcher).toHaveBeenCalledTimes(2)
      expect(fetcher).toHaveBeenLastCalledWith('b', expect.any(Object))
    })

    it('re-fetches on every keystroke', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })

      const { capture, rerender } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      rerender('ap')
      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      rerender('app')
      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      rerender('appl')
      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      rerender('apple')
      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      expect(fetcher).toHaveBeenCalledTimes(5)
    })
  })

  // --------------------------------------------------------------------------
  // Stale data clearing during loading
  // --------------------------------------------------------------------------

  describe('stale data clearing', () => {
    it('clears previous data when a new query starts loading', async () => {
      const firstDeferred = createDeferred<NodeDef[]>()
      const secondDeferred = createDeferred<NodeDef[]>()
      let callCount = 0

      const fetcher = vi.fn(() => {
        callCount++
        return callCount === 1 ? firstDeferred.promise : secondDeferred.promise
      })

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })
      const { capture, rerender } = renderLoader(config.Loader, 'a')

      // Resolve first query
      await act(async () => {
        firstDeferred.resolve(MOCK_NODES)
      })

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toEqual(MOCK_NODES)
      })

      // Change query -- should clear data and show loading
      rerender('b')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(true)
        expect(capture.latest.data).toBeUndefined()
      })
    })

    it('does not show stale results while loading a new query', async () => {
      const deferred1 = createDeferred<NodeDef[]>()
      const deferred2 = createDeferred<NodeDef[]>()
      let callCount = 0

      const fetcher = vi.fn(() => {
        callCount++
        return callCount === 1 ? deferred1.promise : deferred2.promise
      })

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })
      const { capture, rerender } = renderLoader(config.Loader, 'a')

      // Resolve first query with data
      const firstResults = [createNodeDef('1', 'First')]
      await act(async () => {
        deferred1.resolve(firstResults)
      })

      await waitFor(() => {
        expect(capture.latest.data).toEqual(firstResults)
      })

      // Issue new query
      rerender('b')

      // Verify data is cleared, not showing first results
      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(true)
        expect(capture.latest.data).toBeUndefined()
      })

      // Resolve second query with different data
      const secondResults = [createNodeDef('2', 'Second')]
      await act(async () => {
        deferred2.resolve(secondResults)
      })

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toEqual(secondResults)
      })
    })
  })

  // --------------------------------------------------------------------------
  // Abort / race condition handling
  // --------------------------------------------------------------------------

  describe('abort and race conditions', () => {
    it('passes an AbortSignal to the fetcher', async () => {
      let receivedSignal: AbortSignal | undefined

      const fetcher = vi.fn(
        async (_query: string, options?: { signal?: AbortSignal }) => {
          receivedSignal = options?.signal
          return MOCK_NODES
        },
      )
      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })

      renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      expect(receivedSignal).toBeInstanceOf(AbortSignal)
    })

    it('aborts the previous request when query changes', async () => {
      const signals: AbortSignal[] = []

      const fetcher = vi.fn(
        (_query: string, options?: { signal?: AbortSignal }) => {
          if (options?.signal) {
            signals.push(options.signal)
          }
          return new Promise<NodeDef[]>((resolve) => {
            const timeout = setTimeout(() => resolve(MOCK_NODES), 10000)
            options?.signal?.addEventListener('abort', () =>
              clearTimeout(timeout),
            )
          })
        },
      )

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })
      const { rerender } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      // First signal should not be aborted yet
      expect(signals[0].aborted).toBe(false)

      // Change query -- should abort first request
      rerender('ab')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(2)
      })

      expect(signals[0].aborted).toBe(true)
      expect(signals[1].aborted).toBe(false)
    })

    it('aborts on unmount', async () => {
      const signals: AbortSignal[] = []

      const fetcher = vi.fn(
        (_query: string, options?: { signal?: AbortSignal }) => {
          if (options?.signal) {
            signals.push(options.signal)
          }
          // Never resolves
          return new Promise<NodeDef[]>(() => {})
        },
      )

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })
      const { unmount } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      expect(signals[0].aborted).toBe(false)

      unmount()

      expect(signals[0].aborted).toBe(true)
    })

    it('discards late responses from aborted requests', async () => {
      const deferred1 = createDeferred<NodeDef[]>()
      const deferred2 = createDeferred<NodeDef[]>()
      let callCount = 0

      const fetcher = vi.fn(() => {
        callCount++
        return callCount === 1 ? deferred1.promise : deferred2.promise
      })

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })
      const { capture, rerender } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      // Change query before first resolves
      rerender('b')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(2)
      })

      // Resolve second query first (fast server response)
      const secondResults = [createNodeDef('fast', 'Fast')]
      await act(async () => {
        deferred2.resolve(secondResults)
      })

      await waitFor(() => {
        expect(capture.latest.data).toEqual(secondResults)
        expect(capture.latest.isLoading).toBe(false)
      })

      // Now resolve first query (slow server response) -- should be discarded
      const firstResults = [createNodeDef('slow', 'Slow')]
      await act(async () => {
        deferred1.resolve(firstResults)
      })

      // Data should still be from second query
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(capture.latest.data).toEqual(secondResults)
    })
  })

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('handles fetch errors', async () => {
      const error = new Error('Server error')
      const config = createVanillaQueryLoader({
        fetcher: async () => {
          throw error
        },
        minQueryLength: 1,
      })

      const { capture } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.isError).toBe(true)
        expect(capture.latest.error).toBe(error)
        expect(capture.latest.data).toBeUndefined()
      })
    })

    it('wraps non-Error thrown values into Error objects', async () => {
      const config = createVanillaQueryLoader({
        fetcher: async () => {
          throw 'something went wrong'
        },
        minQueryLength: 1,
      })

      const { capture } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(capture.latest.isError).toBe(true)
        expect(capture.latest.error).toBeInstanceOf(Error)
        expect(capture.latest.error?.message).toBe('something went wrong')
      })
    })

    it('does not apply error from aborted request', async () => {
      const deferred1 = createDeferred<NodeDef[]>()
      const deferred2 = createDeferred<NodeDef[]>()
      let callCount = 0

      const fetcher = vi.fn(() => {
        callCount++
        return callCount === 1 ? deferred1.promise : deferred2.promise
      })

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })
      const { capture, rerender } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      // Change query to abort first request
      rerender('b')

      // Reject first request (after abort)
      await act(async () => {
        deferred1.reject(new Error('aborted'))
      })

      // Resolve second request successfully
      await act(async () => {
        deferred2.resolve(MOCK_NODES)
      })

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.isError).toBe(false)
        expect(capture.latest.data).toEqual(MOCK_NODES)
      })
    })
  })

  // --------------------------------------------------------------------------
  // enabled / disabled transitions
  // --------------------------------------------------------------------------

  describe('enabled transitions', () => {
    it('resets state when query drops below minQueryLength', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({
        fetcher,
        minQueryLength: 2,
        initialQueryBehavior: false,
      })

      const { capture, rerender } = renderLoader(config.Loader, 'ab')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toEqual(MOCK_NODES)
      })

      // Drop below minQueryLength
      rerender('a')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toBeUndefined()
        expect(capture.latest.isError).toBe(false)
      })
    })

    it('starts fetching again when query exceeds minQueryLength after being below', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({
        fetcher,
        minQueryLength: 2,
        initialQueryBehavior: false,
      })

      const { capture, rerender } = renderLoader(config.Loader, 'a')

      // Initially disabled, should not fetch
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })
      expect(fetcher).not.toHaveBeenCalled()

      // Cross the threshold
      rerender('ab')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
        expect(capture.latest.data).toEqual(MOCK_NODES)
      })

      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('aborts in-flight request when query drops below minQueryLength', async () => {
      const signals: AbortSignal[] = []

      const fetcher = vi.fn(
        (_query: string, options?: { signal?: AbortSignal }) => {
          if (options?.signal) {
            signals.push(options.signal)
          }
          // Never resolves
          return new Promise<NodeDef[]>(() => {})
        },
      )

      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 2 })
      const { rerender } = renderLoader(config.Loader, 'ab')

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1)
      })

      expect(signals[0].aborted).toBe(false)

      // Drop below minQueryLength
      rerender('a')

      expect(signals[0].aborted).toBe(true)
    })
  })

  // --------------------------------------------------------------------------
  // Refetch
  // --------------------------------------------------------------------------

  describe('refetch', () => {
    it('provides a refetch function that re-fetches with current query', async () => {
      const fetcher = vi.fn(async () => MOCK_NODES)
      const config = createVanillaQueryLoader({ fetcher, minQueryLength: 1 })

      const { capture } = renderLoader(config.Loader, 'a')

      await waitFor(() => {
        expect(capture.latest.isLoading).toBe(false)
      })

      expect(fetcher).toHaveBeenCalledTimes(1)

      act(() => {
        capture.latest.refetch?.()
      })

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(2)
      })

      // Should have been called with the same query
      expect(fetcher).toHaveBeenLastCalledWith('a')
    })
  })
})
