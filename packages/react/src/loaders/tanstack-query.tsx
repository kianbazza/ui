'use client'

import type * as React from 'react'
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
// TanStack Query Adapter
// ============================================================================

/**
 * TanStack Query result shape (subset of UseQueryResult).
 * This allows the adapter to work without requiring @tanstack/react-query as a dependency.
 */
export interface TanStackQueryResult<TData, TError = Error> {
  /** TanStack status (`pending` | `error` | `success`) */
  status?: 'pending' | 'error' | 'success'

  /** TanStack fetch status (`fetching` | `paused` | `idle`) */
  fetchStatus?: 'fetching' | 'paused' | 'idle'

  data: TData | undefined
  error: TError | null | undefined

  /** v5: true when first fetch is in-flight */
  isLoading?: boolean

  /** v5: true when status is pending */
  isPending?: boolean

  /** true when status is success */
  isSuccess?: boolean

  /** true when status is error */
  isError?: boolean

  /** true while any fetch is in-flight */
  isFetching?: boolean

  /** true while background refetch is in-flight */
  isRefetching?: boolean

  /** true when fetch is paused */
  isPaused?: boolean

  /** true once query has fetched at least once */
  isFetched?: boolean

  refetch: () => unknown
}

function toError(error: unknown): Error | null {
  if (error == null) {
    return null
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}

/**
 * Converts a TanStack Query result to an AsyncLoaderResult.
 * Use this to wrap your useQuery hook result.
 *
 * @example
 * ```tsx
 * function MyLoader({ query, children }) {
 *   const result = useQuery({
 *     queryKey: ['items', query],
 *     queryFn: () => fetchItems(query),
 *   })
 *   return children(toAsyncLoaderResult(result))
 * }
 * ```
 */
export function toAsyncLoaderResult<TData, TError = Error>(
  result: TanStackQueryResult<TData, TError>,
): AsyncLoaderResult<TData, TanStackQueryResult<TData, TError>> {
  const hasData = result.data !== undefined

  const fetchStatus: AsyncLoaderFetchStatus = result.fetchStatus
    ? result.fetchStatus
    : result.isPaused
      ? 'paused'
      : result.isFetching || result.isLoading
        ? 'fetching'
        : 'idle'

  const isFetching = fetchStatus === 'fetching'

  const status: AsyncLoaderStatus = result.status
    ? result.status
    : result.isError
      ? 'error'
      : result.isSuccess || hasData
        ? 'success'
        : result.isPending || result.isLoading || isFetching
          ? 'pending'
          : 'idle'

  const isPending = result.isPending ?? status === 'pending'
  const isSuccess = result.isSuccess ?? status === 'success'
  const isError = result.isError ?? status === 'error'
  const isInitialLoading = result.isLoading ?? (isPending && isFetching)
  const isRefetching = result.isRefetching ?? (isFetching && !isInitialLoading)
  const isPaused = result.isPaused ?? fetchStatus === 'paused'
  const hasFetched =
    result.isFetched ??
    (isSuccess || isError || isInitialLoading || isRefetching)

  const loadingPhase: AsyncLoaderLoadingPhase = isInitialLoading
    ? 'initial'
    : isRefetching
      ? 'background'
      : 'none'

  return {
    data: result.data,
    raw: result,
    source: 'tanstack-query',
    error: toError(result.error),
    status,
    fetchStatus,
    loadingPhase,
    isLoading: isInitialLoading,
    isFetching,
    isInitialLoading,
    isRefetching,
    isPending,
    isSuccess,
    isError,
    isPaused,
    hasData,
    hasFetched,
    refetch: result.refetch,
  }
}

/**
 * Props for creating a static loader component.
 */
export interface CreateStaticLoaderProps {
  /**
   * Hook that returns a TanStack Query result.
   * This hook will be called inside the loader component.
   */
  useQuery: () => TanStackQueryResult<NodeDef[]>

  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens
   * - 'lazy': Load when submenu opens (default)
   */
  loadStrategy?: 'eager' | 'lazy'
}

/**
 * Creates a static loader configuration for use with async menus.
 * The hook is called inside a component, so it follows React's rules of hooks.
 *
 * @example
 * ```tsx
 * const recentFilesLoader = createStaticLoader({
 *   useQuery: () => useQuery({
 *     queryKey: ['recent-files'],
 *     queryFn: fetchRecentFiles,
 *     staleTime: 5 * 60 * 1000,
 *   }),
 * })
 *
 * // Use in submenu
 * {
 *   kind: 'submenu',
 *   value: 'Recent Files',
 *   asyncNodes: {
 *     ...recentFilesLoader,
 *     loadStrategy: 'eager',
 *   },
 *   render: ...
 * }
 * ```
 */
export function createStaticLoader(
  props: CreateStaticLoaderProps,
): StaticLoaderConfig {
  const { useQuery, loadStrategy } = props

  const Loader: React.FC<LoaderComponentProps> = ({ children }) => {
    const result = useQuery()
    return <>{children(toAsyncLoaderResult(result))}</>
  }

  return {
    type: 'static',
    Loader,
    loadStrategy,
  }
}

/**
 * Props for creating a query loader component.
 */
export interface CreateQueryLoaderProps {
  /**
   * Hook that returns a TanStack Query result based on the search query.
   * This hook will be called inside the loader component with the current query.
   */
  useQuery: (
    query: string,
    options?: { enabled: boolean },
  ) => TanStackQueryResult<NodeDef[]>
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
 * Creates a query loader configuration for use with async menus.
 * The loader will re-fetch when the search query changes.
 *
 * @example
 * ```tsx
 * const searchLoader = createQueryLoader({
 *   useQuery: (query, options) => useQuery({
 *     queryKey: ['search', query],
 *     queryFn: () => searchItems(query),
 *     enabled: options?.enabled,
 *   }),
 *   minQueryLength: 2,
 * })
 *
 * // Use in submenu
 * {
 *   kind: 'submenu',
 *   value: 'Search',
 *   includeInDeepSearch: true,
 *   asyncNodes: searchLoader,
 *   render: ...
 * }
 * ```
 */
export function createQueryLoader(
  props: CreateQueryLoaderProps,
): QueryLoaderConfig {
  const {
    useQuery,
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
    const result = useQuery(query, { enabled: isEnabled })
    return <>{children(toAsyncLoaderResult(result))}</>
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

/**
 * Creates a loader component that wraps a TanStack Query hook.
 * This is a lower-level utility for custom loader implementations.
 *
 * @example
 * ```tsx
 * const MyLoader = createLoaderComponent((query) =>
 *   useQuery({
 *     queryKey: ['items', query],
 *     queryFn: () => fetchItems(query),
 *   })
 * )
 * ```
 */
export function createLoaderComponent(
  useQueryFn: (query: string) => TanStackQueryResult<NodeDef[]>,
): React.FC<LoaderComponentProps> {
  return function TanStackLoader({ query, children }) {
    const result = useQueryFn(query)
    return <>{children(toAsyncLoaderResult(result))}</>
  }
}
