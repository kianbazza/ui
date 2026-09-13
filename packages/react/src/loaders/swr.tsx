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
// SWR Adapter
// ============================================================================

/**
 * SWR result shape (subset of SWRResponse).
 * This allows the adapter to work without requiring `swr` as a dependency.
 */
export interface SWRResult<TData, TError = Error> {
  data: TData | undefined
  error: TError | undefined
  isLoading?: boolean
  isValidating: boolean
  isPaused?: boolean
  mutate: (...args: unknown[]) => unknown
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
 * Converts an SWR result to an AsyncLoaderResult.
 */
export function toAsyncLoaderResultFromSWR<TData, TError = Error>(
  result: SWRResult<TData, TError>,
): AsyncLoaderResult<TData, SWRResult<TData, TError>> {
  const normalizedError = toError(result.error)
  const hasData = result.data !== undefined

  const fetchStatus: AsyncLoaderFetchStatus = result.isPaused
    ? 'paused'
    : result.isValidating
      ? 'fetching'
      : 'idle'

  const isFetching = fetchStatus === 'fetching'
  const isInitialLoading =
    result.isLoading ?? (isFetching && !hasData && normalizedError == null)
  const isRefetching = isFetching && !isInitialLoading

  const status: AsyncLoaderStatus = normalizedError
    ? 'error'
    : hasData
      ? 'success'
      : isInitialLoading || isFetching
        ? 'pending'
        : 'idle'

  const loadingPhase: AsyncLoaderLoadingPhase = isInitialLoading
    ? 'initial'
    : isRefetching
      ? 'background'
      : 'none'

  return {
    data: result.data,
    raw: result,
    source: 'swr',
    error: normalizedError,
    status,
    fetchStatus,
    loadingPhase,
    isLoading: isInitialLoading,
    isFetching,
    isInitialLoading,
    isRefetching,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    isPaused: fetchStatus === 'paused',
    hasData,
    hasFetched:
      hasData || normalizedError != null || isInitialLoading || isRefetching,
    refetch: () => result.mutate(),
  }
}

/**
 * Props for creating a static SWR loader component.
 */
export interface CreateSWRStaticLoaderProps {
  /** Hook that returns an SWR result. */
  useSWR: () => SWRResult<NodeDef[]>

  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens
   * - 'lazy': Load when submenu opens (default)
   */
  loadStrategy?: 'eager' | 'lazy'
}

/**
 * Creates a static loader configuration backed by SWR.
 */
export function createSWRStaticLoader(
  props: CreateSWRStaticLoaderProps,
): StaticLoaderConfig {
  const { useSWR, loadStrategy } = props

  const Loader: React.FC<LoaderComponentProps> = ({ children }) => {
    const result = useSWR()
    return <>{children(toAsyncLoaderResultFromSWR(result))}</>
  }

  return {
    type: 'static',
    Loader,
    loadStrategy,
  }
}

/**
 * Props for creating a query SWR loader component.
 */
export interface CreateSWRQueryLoaderProps {
  /**
   * Hook that returns an SWR result based on the search query.
   * `options.enabled` can be used to derive a `null` key and disable fetching.
   */
  useSWR: (
    query: string,
    options?: { enabled: boolean },
  ) => SWRResult<NodeDef[]>
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
 * Creates a query loader configuration backed by SWR.
 */
export function createSWRQueryLoader(
  props: CreateSWRQueryLoaderProps,
): QueryLoaderConfig {
  const {
    useSWR,
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
    const result = useSWR(query, { enabled: isEnabled })
    return <>{children(toAsyncLoaderResultFromSWR(result))}</>
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
 * Creates a loader component that wraps an SWR hook.
 */
export function createSWRLoaderComponent(
  useSWRFn: (query: string) => SWRResult<NodeDef[]>,
): React.FC<LoaderComponentProps> {
  return function SWRLoader({ query, children }) {
    const result = useSWRFn(query)
    return <>{children(toAsyncLoaderResultFromSWR(result))}</>
  }
}
