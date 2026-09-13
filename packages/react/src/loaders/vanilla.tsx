'use client'

import * as React from 'react'
import type {
  AsyncLoaderFetchStatus,
  AsyncLoaderLoadingPhase,
  AsyncLoaderResult,
  AsyncLoaderStatus,
  InitialQueryBehavior,
  LoaderComponentProps,
  NodeDef,
  QueryLoaderConfig,
  StaticLoaderConfig,
} from '../internal/popup-menu/data-first/types.js'

// ============================================================================
// Vanilla Async Adapter (no external dependencies)
// ============================================================================

interface VanillaAsyncInternalState<TData> {
  data: TData | undefined
  error: Error | null
  isFetching: boolean
  hasFetched: boolean
}

function normalizeError(error: unknown): Error | null {
  if (error == null) {
    return null
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}

function getVanillaStatus<TData>(
  state: VanillaAsyncInternalState<TData>,
): AsyncLoaderStatus {
  if (state.error) {
    return 'error'
  }

  if (state.data !== undefined) {
    return 'success'
  }

  if (state.isFetching) {
    return 'pending'
  }

  return 'idle'
}

function toVanillaAsyncLoaderResult<TData>(
  state: VanillaAsyncInternalState<TData>,
  refetch: () => unknown,
): AsyncLoaderResult<TData> {
  const status = getVanillaStatus(state)
  const fetchStatus: AsyncLoaderFetchStatus = state.isFetching
    ? 'fetching'
    : 'idle'

  const isInitialLoading = state.isFetching && !state.hasFetched
  const isRefetching = state.isFetching && state.hasFetched

  const loadingPhase: AsyncLoaderLoadingPhase = isInitialLoading
    ? 'initial'
    : isRefetching
      ? 'background'
      : 'none'

  return {
    data: state.data,
    source: 'vanilla',
    error: state.error,
    status,
    fetchStatus,
    loadingPhase,
    isLoading: isInitialLoading,
    isFetching: state.isFetching,
    isInitialLoading,
    isRefetching,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    isPaused: false,
    hasData: state.data !== undefined,
    hasFetched: state.hasFetched,
    refetch,
  }
}

/**
 * Internal hook for managing async state with plain promises.
 * Use this when you don't have TanStack Query or SWR.
 */
function useAsyncState<T>(
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean },
): AsyncLoaderResult<T> {
  const { enabled = true } = options ?? {}
  const [state, setState] = React.useState<VanillaAsyncInternalState<T>>(
    () => ({
      data: undefined,
      error: null,
      isFetching: enabled,
      hasFetched: false,
    }),
  )

  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = React.useCallback(() => {
    setState((s) => ({ ...s, isFetching: true, error: null }))
    fetcherRef
      .current()
      .then((data) => {
        setState({
          data,
          error: null,
          isFetching: false,
          hasFetched: true,
        })
      })
      .catch((error) => {
        setState((s) => ({
          ...s,
          error: normalizeError(error),
          isFetching: false,
          hasFetched: true,
        }))
      })
  }, [])

  React.useEffect(() => {
    if (enabled) {
      refetch()
      return
    }

    setState((s) => ({
      ...s,
      isFetching: false,
    }))
  }, [enabled, refetch])

  return React.useMemo(
    () => toVanillaAsyncLoaderResult(state, refetch),
    [state, refetch],
  )
}

/**
 * Internal hook for managing query-dependent async state with plain promises.
 * Unlike `useAsyncState`, this hook re-fetches whenever the query changes.
 * Aborts in-flight requests when a new query is issued or the component unmounts.
 */
function useAsyncQueryState(
  fetcher: (
    query: string,
    options?: { signal?: AbortSignal },
  ) => Promise<NodeDef[]>,
  query: string,
  options?: { enabled?: boolean },
): AsyncLoaderResult<NodeDef[]> {
  const { enabled = true } = options ?? {}
  const [state, setState] = React.useState<
    VanillaAsyncInternalState<NodeDef[]>
  >(() => ({
    data: undefined,
    error: null,
    isFetching: enabled,
    hasFetched: false,
  }))

  const fetcherRef = React.useRef(fetcher)
  fetcherRef.current = fetcher

  React.useEffect(() => {
    if (!enabled) {
      setState({
        data: undefined,
        error: null,
        isFetching: false,
        hasFetched: false,
      })
      return
    }

    const controller = new AbortController()

    setState({
      data: undefined,
      error: null,
      isFetching: true,
      hasFetched: false,
    })

    fetcherRef
      .current(query, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({
            data,
            error: null,
            isFetching: false,
            hasFetched: true,
          })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({
            data: undefined,
            error: normalizeError(error),
            isFetching: false,
            hasFetched: true,
          })
        }
      })

    return () => {
      controller.abort()
    }
  }, [enabled, query])

  const refetch = React.useCallback(() => {
    // Trigger re-run by toggling a state-based effect isn't ideal here,
    // so we do a manual fetch that respects the current query/enabled state.
    setState((s) => ({
      ...s,
      isFetching: true,
      error: null,
    }))
    fetcherRef
      .current(query)
      .then((data) => {
        setState({
          data,
          error: null,
          isFetching: false,
          hasFetched: true,
        })
      })
      .catch((error) => {
        setState((s) => ({
          ...s,
          error: normalizeError(error),
          isFetching: false,
          hasFetched: true,
        }))
      })
  }, [query])

  return React.useMemo(
    () => toVanillaAsyncLoaderResult(state, refetch),
    [state, refetch],
  )
}

/**
 * Props for creating a static loader with vanilla fetch.
 */
export interface CreateVanillaStaticLoaderProps {
  /**
   * Async function that fetches the menu items.
   */
  fetcher: () => Promise<NodeDef[]>

  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens
   * - 'lazy': Load when submenu opens (default)
   */
  loadStrategy?: 'eager' | 'lazy'
}

/**
 * Creates a static loader configuration using plain fetch/promises.
 * No external data library required.
 *
 * @example
 * ```tsx
 * const recentFilesLoader = createVanillaStaticLoader({
 *   fetcher: async () => {
 *     const res = await fetch('/api/recent-files')
 *     const data = await res.json()
 *     return data.map(file => ({
 *       kind: 'item',
 *       value: file.name,
 *       render: ...
 *     }))
 *   },
 * })
 * ```
 */
export function createVanillaStaticLoader(
  props: CreateVanillaStaticLoaderProps,
): StaticLoaderConfig {
  const { fetcher, loadStrategy } = props

  const Loader: React.FC<LoaderComponentProps> = ({ children }) => {
    const result = useAsyncState(fetcher)
    return <>{children(result)}</>
  }

  return {
    type: 'static',
    Loader,
    loadStrategy,
  }
}

/**
 * Props for creating a query loader with vanilla fetch.
 */
export interface CreateVanillaQueryLoaderProps {
  /**
   * Async function that fetches menu items based on the search query.
   * Receives an optional `signal` that is aborted when a newer query is issued,
   * allowing you to cancel in-flight requests (e.g. pass it to `fetch()`).
   */
  fetcher: (
    query: string,
    options?: { signal?: AbortSignal },
  ) => Promise<NodeDef[]>
  /**
   * Minimum query length before fetching.
   * @default 1
   */
  minQueryLength?: number
  /**
   * Initial query behavior before user input reaches minQueryLength.
   * Defaults to fetching with an empty query.
   */
  initialQueryBehavior?: InitialQueryBehavior | false
  /**
   * @deprecated Use `initialQueryBehavior` instead.
   */
  initialQuery?: string
  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens (good for deep search)
   * - 'lazy': Load when submenu opens (default)
   * @default 'lazy'
   */
  loadStrategy?: 'eager' | 'lazy'
  /**
   * What to show when query is below minQueryLength.
   * @default 'empty'
   */
  belowMinBehavior?: 'empty' | 'placeholder'
  /**
   * Placeholder nodes shown when query is below minQueryLength.
   */
  placeholderNodes?: NodeDef[]
}

/**
 * Creates a query loader configuration using plain fetch/promises.
 * No external data library required.
 *
 * @example
 * ```tsx
 * const searchLoader = createVanillaQueryLoader({
 *   fetcher: async (query, options) => {
 *     const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
 *       signal: options?.signal, // aborts when a newer query is issued
 *     })
 *     const data = await res.json()
 *     return data.map(item => ({
 *       kind: 'item',
 *       value: item.name,
 *       render: ...
 *     }))
 *   },
 *   minQueryLength: 2,
 * })
 * ```
 */
export function createVanillaQueryLoader(
  props: CreateVanillaQueryLoaderProps,
): QueryLoaderConfig {
  const {
    fetcher,
    minQueryLength = 1,
    initialQueryBehavior,
    initialQuery,
    loadStrategy,
    belowMinBehavior = 'empty',
    placeholderNodes,
  } = props

  const resolvedInitialQueryBehavior: InitialQueryBehavior | false =
    initialQueryBehavior !== undefined
      ? initialQueryBehavior
      : initialQuery !== undefined
        ? { value: initialQuery, loadWhen: 'needed' }
        : { value: '', loadWhen: 'needed' }

  const Loader: React.FC<LoaderComponentProps> = ({
    query,
    enabled,
    children,
  }) => {
    const isEnabled =
      enabled ??
      (query.length >= minQueryLength || resolvedInitialQueryBehavior !== false)
    const result = useAsyncQueryState(fetcher, query, { enabled: isEnabled })
    return <>{children(result)}</>
  }

  return {
    type: 'query',
    Loader,
    minQueryLength,
    initialQueryBehavior: resolvedInitialQueryBehavior,
    initialQuery,
    loadStrategy,
    belowMinBehavior,
    placeholderNodes,
  }
}
