'use client'

import * as React from 'react'
import type { PopupMenuNode } from '../menu-tree/types.js'
import type {
  AsyncLoaderConfig,
  DataListChildrenState,
  DeepSearchConfig,
  DisplayNode,
  IncludeInDeepSearch,
  NodeDef,
} from './types.js'

// ============================================================================
// Data Surface Context
// ============================================================================

export interface DataSurfaceContextValue {
  /** The original node definitions */
  content: NodeDef[]

  /** Async content configuration for root-level async loading */
  asyncContent?: AsyncLoaderConfig

  /** Deep search configuration */
  deepSearchConfig: DeepSearchConfig

  /** Default submenu inclusion mode for deep search */
  includeInDeepSearch: IncludeInDeepSearch

  /** List element ID for aria-activedescendant */
  listId: string
}

export const DataSurfaceContext =
  React.createContext<DataSurfaceContextValue | null>(null)

// ============================================================================
// Popup-level Data Context (shared across sibling DataSurface/DataSubpages)
// ============================================================================

export interface ResolvedNodesSlot {
  nodes: readonly PopupMenuNode[]
  graftVersion: number
  /** The `content` prop the slot was published for; consumers drop a slot whose content the root surface no longer supplies. */
  content: NodeDef[]
}

export interface DataPopupContextValue {
  /** Latest DataSurface context registered within this popup. */
  dataSurfaceContext: DataSurfaceContextValue | null
  /** Registers/clears DataSurface context for sibling consumers. */
  setDataSurfaceContext: React.Dispatch<
    React.SetStateAction<DataSurfaceContextValue | null>
  >
  /**
   * The resolved-nodes slot: the root list's current Menu Nodes plus the
   * graft version that changes when loader results are grafted under a
   * branch (which mutates `children` without changing the outer array).
   * Null until the root list registers. Retained while a subpage is active
   * and the root list is unmounted; the Menu Tree persists on the resolver.
   */
  resolvedNodes: ResolvedNodesSlot | null
  setResolvedNodes: React.Dispatch<
    React.SetStateAction<ResolvedNodesSlot | null>
  >
}

export const DataPopupContext =
  React.createContext<DataPopupContextValue | null>(null)

export function useDataSurfaceContext(): DataSurfaceContextValue {
  const context = React.useContext(DataSurfaceContext)
  if (!context) {
    throw new Error(
      'useDataSurfaceContext must be used within a DataSurface component',
    )
  }
  return context
}

export function useMaybeDataSurfaceContext(): DataSurfaceContextValue | null {
  return React.useContext(DataSurfaceContext)
}

export function useDataPopupContext(): DataPopupContextValue {
  const context = React.useContext(DataPopupContext)
  if (!context) {
    throw new Error('Data components must be used within PopupMenu.Popup')
  }
  return context
}

export function useMaybeDataPopupContext(): DataPopupContextValue | null {
  return React.useContext(DataPopupContext)
}

// ============================================================================
// Data List Context
// ============================================================================

export const DataListContext =
  React.createContext<DataListChildrenState | null>(null)

export function useDataList(): DataListChildrenState {
  const context = React.useContext(DataListContext)
  if (!context) {
    throw new Error('useDataList must be used within a List component')
  }
  return context
}

export function useMaybeDataList(): DataListChildrenState | null {
  return React.useContext(DataListContext)
}

// ============================================================================
// Render Node Function Type
// ============================================================================

export type RenderNodeFn = (displayNode: DisplayNode) => React.ReactNode
