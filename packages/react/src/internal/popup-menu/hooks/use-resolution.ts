'use client'

import * as React from 'react'
import type { AsyncSubmenuInfo } from '../data-first/async.js'
import type { AsyncMenuCoordinatorValue } from '../data-first/async-coordinator.js'
import type {
  AsyncLoaderConfig,
  NodeDef,
  SubmenuDef,
  SubpageDef,
} from '../data-first/types.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import type { PopupMenuNode } from '../menu-tree/types.js'

export interface UseResolutionOptions {
  resolver: MenuTreeResolver | null
  content: NodeDef[]
  asyncContent: AsyncLoaderConfig | undefined
  coordinator: AsyncMenuCoordinatorValue | null
  graftParent: PopupMenuNode | null
  isSubpageSurface: boolean
  isResolutionRoot: boolean
  asyncSubmenus: readonly AsyncSubmenuInfo[]
}

export interface ResolutionResult {
  nodes: readonly PopupMenuNode[]
  graftVersion: number
}

export function useResolution({
  resolver,
  content,
  asyncContent,
  coordinator,
  graftParent,
  isSubpageSurface,
  isResolutionRoot,
  asyncSubmenus,
}: UseResolutionOptions): ResolutionResult {
  React.useMemo(() => {
    if (!resolver || isSubpageSurface) return
    if (graftParent) resolver.graft(graftParent, content)
    else if (isResolutionRoot) resolver.setContent(content)
  }, [resolver, content, graftParent, isSubpageSurface, isResolutionRoot])

  const [graftVersion, setGraftVersion] = React.useState(0)
  const previousBranchesRef = React.useRef<Set<SubmenuDef | SubpageDef>>(
    new Set(),
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: ADR-0002 — the loader phase is keyed on the coordinator's loader map (the true input), not the coordinator object or its stable callbacks
  React.useEffect(() => {
    if (!resolver || !coordinator || isSubpageSurface) return
    // Every target is re-grafted with its current base on every run — static
    // children alone when its loader has no usable result — so a result that
    // disappears (pending again, errored, unregistered) is withdrawn from the
    // Menu Tree. The resolver's reference fast path and structural
    // short-circuit make the unchanged cases free.
    const results = new Map(
      coordinator.getAsyncNodes().map((entry) => [entry.id, entry.nodes]),
    )
    let changed = false
    const graft = (parent: PopupMenuNode | null, defs: readonly NodeDef[]) => {
      if (!parent) return
      const before = parent.children
      resolver.graft(parent, defs)
      changed ||= before !== parent.children
    }

    const rootResult = results.get('__root__')
    const base = rootResult
      ? asyncContent
        ? rootResult
        : [...content, ...rootResult]
      : content
    if (graftParent) graft(graftParent, base)
    else if (isResolutionRoot) {
      const before = resolver.rootNodes
      resolver.setContent(base)
      changed ||= before !== resolver.rootNodes
    }

    // Branches that left the async set since the last run are restored to
    // their static children so an unregistered loader's result is withdrawn.
    const current = new Set(asyncSubmenus.map((info) => info.node))
    for (const node of previousBranchesRef.current) {
      if (current.has(node)) continue
      const branch = resolver.getNodeForDef(node)
      if (branch) graft(branch, node.nodes ?? [])
    }
    previousBranchesRef.current = current

    for (const info of asyncSubmenus) {
      const branch = resolver.getNodeForDef(info.node)
      if (!branch) continue
      const loaded = results.get(info.id)
      const staticChildren = info.node.nodes ?? []
      graft(branch, loaded ? [...staticChildren, ...loaded] : staticChildren)
    }
    if (changed) setGraftVersion((version) => version + 1)
  }, [
    resolver,
    coordinator?.loaders,
    coordinator?.erroredLoaders,
    content,
    asyncContent,
    asyncSubmenus,
    graftParent,
    isSubpageSurface,
    isResolutionRoot,
  ])

  // Read after the static phase so a `content` change is visible in the same
  // render; `graftVersion` is the change signal for grafts under branch nodes,
  // which mutate `children` without changing the outer array identity.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the resolution inputs (content, graftVersion), not on resolver fields
  const nodes = React.useMemo(
    () =>
      graftParent
        ? graftParent.children
        : isResolutionRoot && resolver
          ? resolver.rootNodes
          : [],
    [graftParent, resolver, isResolutionRoot, content, graftVersion],
  )
  return { nodes, graftVersion }
}
