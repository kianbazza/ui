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
  /** Breadcrumbs path to this menu (for merging into tree) */
  breadcrumbs: string[]
  /** The loader configuration */
  config: AsyncLoaderConfig
  /** Current loader result */
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

  // ---- Search Query ----
  /** Current search query from the store */
  searchQuery: string

  // ---- Loader State ----
  /** All registered loaders */
  loaders: Map<string, AsyncMenuState>

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
  /** The root (__root__) loader is currently in initial loading phase */
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
  /** Get all resolved async nodes with their breadcrumbs */
  getAsyncNodes: () => Array<{
    id: string
    breadcrumbs: string[]
    nodes: NodeDef[]
  }>

  // ---- Error Tracking ----
  /** Loaders that errored */
  erroredLoaders: Map<string, Error>

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

  // Track errored loaders
  const [erroredLoaders, setErroredLoaders] = React.useState<
    Map<string, Error>
  >(() => new Map())

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
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isFetching) {
        return true
      }
    }
    return false
  }, [loaders])

  const isStaticLoading = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isLoading) {
        return true
      }
    }
    return false
  }, [loaders])

  const isStaticInitialLoading = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isInitialLoading) {
        return true
      }
    }
    return false
  }, [loaders])

  const isStaticRefetching = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isRefetching) {
        return true
      }
    }
    return false
  }, [loaders])

  const isQueryFetching = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isFetching) {
        return true
      }
    }
    return false
  }, [loaders])

  const isQueryLoading = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isLoading) {
        return true
      }
    }
    return false
  }, [loaders])

  const isQueryInitialLoading = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isInitialLoading) {
        return true
      }
    }
    return false
  }, [loaders])

  const isQueryRefetching = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isRefetching) {
        return true
      }
    }
    return false
  }, [loaders])

  const isAnyFetching = isStaticFetching || isQueryFetching
  const isAnyLoading = isStaticLoading || isQueryLoading
  const isAnyInitialLoading = isStaticInitialLoading || isQueryInitialLoading
  const isAnyRefetching = isStaticRefetching || isQueryRefetching
  const isAllRefetching = React.useMemo(() => {
    if (loaders.size === 0) {
      return false
    }

    for (const [, state] of loaders) {
      if (!state.result.isRefetching) {
        return false
      }
    }

    return true
  }, [loaders])

  // Only the root loader (__root__) — i.e. the DataSurface's own asyncContent.
  // Child submenu loaders are not included; they show loading on their own triggers.
  const isRootLoading = React.useMemo(() => {
    const rootLoader = loaders.get('__root__')
    return rootLoader?.result.isLoading ?? false
  }, [loaders])

  const allResolved = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.result.isFetching) {
        return false
      }
    }
    return true
  }, [loaders])

  // Get all resolved async nodes
  const getAsyncNodes = React.useCallback(() => {
    const result: Array<{
      id: string
      breadcrumbs: string[]
      nodes: NodeDef[]
    }> = []

    for (const [id, state] of loaders) {
      // Skip errored loaders
      if (erroredLoaders.has(id)) {
        continue
      }

      // Add resolved data
      if (state.result.data) {
        result.push({
          id,
          breadcrumbs: state.breadcrumbs,
          nodes: state.result.data,
        })
      }
    }

    return result
  }, [loaders, erroredLoaders])

  // Get aggregate async state
  const getAsyncState = React.useCallback((): AsyncState => {
    const skippedMenus: Array<{ id: string; reason: 'error' }> = []

    for (const [id] of erroredLoaders) {
      skippedMenus.push({ id, reason: 'error' })
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
  ])

  // Context value
  const contextValue: AsyncMenuCoordinatorValue = React.useMemo(
    () => ({
      registerLoader,
      unregisterLoader,
      updateLoaderResult,
      searchQuery,
      loaders,
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
      getAsyncState,
    }),
    [
      registerLoader,
      unregisterLoader,
      updateLoaderResult,
      searchQuery,
      loaders,
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
      getAsyncState,
    ],
  )

  return (
    <AsyncMenuCoordinatorContext.Provider value={contextValue}>
      {children}
    </AsyncMenuCoordinatorContext.Provider>
  )
}
