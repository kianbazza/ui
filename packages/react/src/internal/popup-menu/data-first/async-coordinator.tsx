'use client'

import * as React from 'react'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  AsyncState,
  NodeDef,
} from './types.js'

// ============================================================================
// Types
// ============================================================================

/**
 * State for a registered async loader.
 */
export interface AsyncMenuState {
  /** Unique identifier for this async menu */
  id: string
  /** The loader configuration */
  config: AsyncLoaderConfig
  /** Current loader result */
  result: AsyncLoaderResult<NodeDef[]>
}

export interface RootAsyncMenuState {
  config: AsyncLoaderConfig
  result: AsyncLoaderResult<NodeDef[]>
}

/**
 * Context value for the async menu coordinator.
 */
export interface AsyncMenuCoordinatorValue {
  // ---- Registration ----
  /** Register a new async loader */
  registerLoader: (state: AsyncMenuState) => void
  /** Unregister an async loader */
  unregisterLoader: (id: string) => void
  /** Update loader result */
  updateLoaderResult: (id: string, result: AsyncLoaderResult<NodeDef[]>) => void
  registerRootLoader: (state: RootAsyncMenuState) => void
  unregisterRootLoader: () => void
  updateRootLoaderResult: (result: AsyncLoaderResult<NodeDef[]>) => void

  // ---- Search Query ----
  /** Current search query from the store */
  searchQuery: string

  // ---- Loader State ----
  /** All registered loaders */
  loaders: Map<string, AsyncMenuState>
  /** The root surface's own `asyncContent` loader; `null` when none is registered. Never present in `loaders`. */
  root: RootAsyncMenuState | null

  // ---- Computed State ----
  /** Any loader is currently in initial loading phase */
  isAnyLoading: boolean
  /** Any loader is currently fetching (initial or background) */
  isAnyFetching: boolean
  /** Any loader is currently in first-load phase */
  isAnyInitialLoading: boolean
  /** Any loader is currently in background refetch phase */
  isAnyRefetching: boolean
  /** All registered loaders are currently in background refetch phase */
  isAllRefetching: boolean
  /** The root loader is currently in initial loading phase */
  isRootLoading: boolean
  /** Static loaders are currently in initial loading phase */
  isStaticLoading: boolean
  /** Static loaders are currently fetching */
  isStaticFetching: boolean
  /** Static loaders in first-load phase */
  isStaticInitialLoading: boolean
  /** Static loaders in background refetch phase */
  isStaticRefetching: boolean
  /** Query loaders are currently in initial loading phase */
  isQueryLoading: boolean
  /** Query loaders are currently fetching */
  isQueryFetching: boolean
  /** Query loaders in first-load phase */
  isQueryInitialLoading: boolean
  /** Query loaders in background refetch phase */
  isQueryRefetching: boolean
  /** All loaders have resolved (not fetching) */
  allResolved: boolean

  // ---- Async Nodes ----
  /** Every loader with a usable result: the root entry (if any) and one branch entry per Resolved ID. */
  getAsyncNodes: () => Array<
    | { kind: 'root'; nodes: NodeDef[] }
    | { kind: 'branch'; id: string; nodes: NodeDef[] }
  >

  // ---- Error Tracking ----
  /** Loaders that errored */
  erroredLoaders: Map<string, Error>
  rootError: Error | null

  // ---- Aggregated State ----
  /** Get the aggregate async state for DataList */
  getAsyncState: () => AsyncState
}

// ============================================================================
// Context
// ============================================================================

export const AsyncMenuCoordinatorContext =
  React.createContext<AsyncMenuCoordinatorValue | null>(null)

export function useAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return React.useContext(AsyncMenuCoordinatorContext)
}

export function useMaybeAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return React.useContext(AsyncMenuCoordinatorContext)
}

// ============================================================================
// Provider Props
// ============================================================================

export interface AsyncMenuCoordinatorProviderProps {
  /** Children to render */
  children: React.ReactNode
  /** Current search query from the store */
  searchQuery: string
}

// ============================================================================
// Provider Component
// ============================================================================

export function AsyncMenuCoordinatorProvider(
  props: AsyncMenuCoordinatorProviderProps,
) {
  const { children, searchQuery } = props

  // Registered loaders
  const [loaders, setLoaders] = React.useState<Map<string, AsyncMenuState>>(
    () => new Map(),
  )
  const [root, setRoot] = React.useState<RootAsyncMenuState | null>(null)

  // Track errored loaders
  const [erroredLoaders, setErroredLoaders] = React.useState<
    Map<string, Error>
  >(() => new Map())
  const [rootError, setRootError] = React.useState<Error | null>(null)

  const registerRootLoader = React.useCallback((state: RootAsyncMenuState) => {
    setRoot(state)
  }, [])
  const unregisterRootLoader = React.useCallback(() => {
    setRoot(null)
    setRootError(null)
  }, [])
  const updateRootLoaderResult = React.useCallback(
    (result: AsyncLoaderResult<NodeDef[]>) => {
      setRoot((prev) => (prev ? { ...prev, result } : prev))
      // Same transitions as branch loaders: set on a real error, clear only
      // once the loader is no longer errored.
      if (result.isError && result.error) setRootError(result.error)
      else if (!result.isError) setRootError(null)
    },
    [],
  )

  // Register a loader
  const registerLoader = React.useCallback((state: AsyncMenuState) => {
    setLoaders((prev) => {
      const next = new Map(prev)
      next.set(state.id, state)
      return next
    })
  }, [])

  // Unregister a loader
  const unregisterLoader = React.useCallback((id: string) => {
    setLoaders((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })

    // Clear error state
    setErroredLoaders((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Update loader result
  const updateLoaderResult = React.useCallback(
    (id: string, result: AsyncLoaderResult<NodeDef[]>) => {
      setLoaders((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev

        const next = new Map(prev)
        next.set(id, { ...existing, result })
        return next
      })

      // Track errors
      if (result.isError && result.error) {
        setErroredLoaders((prev) => {
          const next = new Map(prev)
          next.set(id, result.error!)
          return next
        })
      } else if (!result.isError) {
        setErroredLoaders((prev) => {
          if (!prev.has(id)) return prev
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      }
    },
    [],
  )

  // Computed loading states
  const isStaticFetching = React.useMemo(() => {
    if (root?.config.type === 'static' && root.result.isFetching) return true
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isFetching) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isStaticLoading = React.useMemo(() => {
    if (root?.config.type === 'static' && root.result.isLoading) return true
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isLoading) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isStaticInitialLoading = React.useMemo(() => {
    if (root?.config.type === 'static' && root.result.isInitialLoading)
      return true
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isInitialLoading) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isStaticRefetching = React.useMemo(() => {
    if (root?.config.type === 'static' && root.result.isRefetching) return true
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isRefetching) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isQueryFetching = React.useMemo(() => {
    if (root?.config.type === 'query' && root.result.isFetching) return true
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isFetching) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isQueryLoading = React.useMemo(() => {
    if (root?.config.type === 'query' && root.result.isLoading) return true
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isLoading) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isQueryInitialLoading = React.useMemo(() => {
    if (root?.config.type === 'query' && root.result.isInitialLoading)
      return true
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isInitialLoading) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isQueryRefetching = React.useMemo(() => {
    if (root?.config.type === 'query' && root.result.isRefetching) return true
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isRefetching) {
        return true
      }
    }
    return false
  }, [loaders, root])

  const isAnyFetching =
    (root?.result.isFetching ?? false) || isStaticFetching || isQueryFetching
  const isAnyLoading =
    (root?.result.isLoading ?? false) || isStaticLoading || isQueryLoading
  const isAnyInitialLoading =
    (root?.result.isInitialLoading ?? false) ||
    isStaticInitialLoading ||
    isQueryInitialLoading
  const isAnyRefetching =
    (root?.result.isRefetching ?? false) ||
    isStaticRefetching ||
    isQueryRefetching
  const isAllRefetching = React.useMemo(() => {
    if (loaders.size === 0 && !root) {
      return false
    }

    for (const [, state] of loaders) {
      if (!state.result.isRefetching) {
        return false
      }
    }
    return root ? root.result.isRefetching : true
  }, [loaders, root])

  const isRootLoading = React.useMemo(() => {
    return root?.result.isLoading ?? false
  }, [root])

  const allResolved = React.useMemo(() => {
    if (root?.result.isFetching) return false
    for (const [, state] of loaders) {
      if (state.result.isFetching) {
        return false
      }
    }
    return true
  }, [loaders, root])

  // Get all resolved async nodes
  const getAsyncNodes = React.useCallback(() => {
    const result: Array<
      | { kind: 'root'; nodes: NodeDef[] }
      | { kind: 'branch'; id: string; nodes: NodeDef[] }
    > = []

    if (root?.result.data && !rootError) {
      result.push({ kind: 'root', nodes: root.result.data })
    }

    for (const [id, state] of loaders) {
      // Skip errored loaders
      if (erroredLoaders.has(id)) {
        continue
      }

      // Add resolved data
      if (state.result.data) {
        result.push({
          kind: 'branch',
          id,
          nodes: state.result.data,
        })
      }
    }

    return result
  }, [loaders, erroredLoaders, root, rootError])

  // Get aggregate async state
  const getAsyncState = React.useCallback((): AsyncState => {
    const skippedMenus: AsyncState['skippedMenus'] = []

    if (rootError) skippedMenus.push({ kind: 'root', reason: 'error' })

    for (const [id] of erroredLoaders) {
      skippedMenus.push({ kind: 'branch', id, reason: 'error' })
    }

    return {
      isLoading: isAnyLoading,
      isFetching: isAnyFetching,
      isInitialLoading: isAnyInitialLoading,
      isRefetching: isAnyRefetching,
      isAllRefetching,
      isStaticLoading,
      isStaticInitialLoading,
      isStaticRefetching,
      isQueryLoading,
      isQueryInitialLoading,
      isQueryRefetching,
      skippedMenus,
    }
  }, [
    isAnyFetching,
    isAnyLoading,
    isAnyInitialLoading,
    isAnyRefetching,
    isAllRefetching,
    isStaticLoading,
    isStaticInitialLoading,
    isStaticRefetching,
    isQueryLoading,
    isQueryInitialLoading,
    isQueryRefetching,
    erroredLoaders,
    rootError,
  ])

  // Context value
  const contextValue: AsyncMenuCoordinatorValue = React.useMemo(
    () => ({
      registerLoader,
      unregisterLoader,
      updateLoaderResult,
      registerRootLoader,
      unregisterRootLoader,
      updateRootLoaderResult,
      searchQuery,
      loaders,
      root,
      isAnyLoading,
      isAnyFetching,
      isAnyInitialLoading,
      isAnyRefetching,
      isAllRefetching,
      isRootLoading,
      isStaticLoading,
      isStaticFetching,
      isStaticInitialLoading,
      isStaticRefetching,
      isQueryLoading,
      isQueryFetching,
      isQueryInitialLoading,
      isQueryRefetching,
      allResolved,
      getAsyncNodes,
      erroredLoaders,
      rootError,
      getAsyncState,
    }),
    [
      registerLoader,
      unregisterLoader,
      updateLoaderResult,
      registerRootLoader,
      unregisterRootLoader,
      updateRootLoaderResult,
      searchQuery,
      loaders,
      root,
      isAnyLoading,
      isAnyFetching,
      isAnyInitialLoading,
      isAnyRefetching,
      isAllRefetching,
      isRootLoading,
      isStaticLoading,
      isStaticFetching,
      isStaticInitialLoading,
      isStaticRefetching,
      isQueryLoading,
      isQueryFetching,
      isQueryInitialLoading,
      isQueryRefetching,
      allResolved,
      getAsyncNodes,
      erroredLoaders,
      rootError,
      getAsyncState,
    ],
  )

  return (
    <AsyncMenuCoordinatorContext.Provider value={contextValue}>
      {children}
    </AsyncMenuCoordinatorContext.Provider>
  )
}
