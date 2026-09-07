import type { NodeDef } from '../deep-search/types.js'
import {
  childDefsOf,
  contributesDefinitionPath,
  defaultGetResolvedId,
  definitionKeyForDef,
  resolveNodeDefs,
} from './resolve.js'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
  PopupMenuNode,
  UnresolvedMenuNode,
} from './types.js'

/**
 * Owns the single resolved node tree for one menu root. Content may be
 * re-supplied at any time (`setContent`) and late defs may be grafted under
 * an already-resolved parent (`graft`); both reconcile by id with a
 * reference fast path, so node instances are stable and repeat calls with
 * identical arguments are no-ops.
 */
export interface MenuTreeResolver {
  /** The Resolved ID seam this resolver was created with. */
  readonly getResolvedId: GetResolvedIdFn
  /** Definition Key uniqueness policy, captured when this resolver is created. */
  readonly idScope: PopupMenuIdScope
  /** Current root nodes, in def order. */
  readonly rootNodes: readonly PopupMenuNode[]
  /** Re-supply the root def list and reconcile the whole tree. */
  setContent(defs: readonly NodeDef[]): void
  /**
   * Resolve `defs` under `parent` (the graft point) and reconcile them
   * against `parent.children`. `defs` is the parent's full child list
   * from the graft source's perspective (static + late defs).
   */
  graft(parent: PopupMenuNode, defs: readonly NodeDef[]): void
  /** Node whose current `def` is reference-equal to `def`, if any. */
  getNodeForDef<D extends NodeDef>(def: D): PopupMenuNode<D> | undefined
  /** First registration wins; best-effort when ids collide. */
  getNodeById(id: string): PopupMenuNode | undefined
}

export interface MenuTreeResolverOptions {
  /** Resolved-ID seam; defaults to `defaultGetResolvedId`. */
  getResolvedId?: GetResolvedIdFn
  /** Definition Key uniqueness scope; captured when this resolver is created. */
  idScope?: PopupMenuIdScope
}

function prospectiveIdentity(
  def: NodeDef,
  parent: PopupMenuNode | null,
  basePath: readonly string[],
  index: number,
  getResolvedId: GetResolvedIdFn,
): { definitionKey: string; definitionPath: string[]; id: string } {
  const definitionKey = definitionKeyForDef(def)
  const definitionPath = [...basePath, definitionKey]
  const probe: UnresolvedMenuNode = {
    def,
    kind: def.kind,
    definitionKey,
    definitionPath,
    parent,
    children: [],
    depth: parent ? parent.depth + 1 : 0,
    index,
  }
  return { definitionKey, definitionPath, id: getResolvedId(probe) }
}

export function createMenuTreeResolver(
  options: MenuTreeResolverOptions = {},
): MenuTreeResolver {
  const idScope = options.idScope ?? 'surface'
  const getResolvedId =
    options.getResolvedId ?? ((node) => defaultGetResolvedId(node, idScope))
  let rootNodes: PopupMenuNode[] = []
  let lastRootDefs: readonly NodeDef[] | null = null
  const defToNode = new Map<NodeDef, PopupMenuNode>()
  const idToNode = new Map<string, PopupMenuNode>()
  const lastGraftDefs = new WeakMap<PopupMenuNode, readonly NodeDef[]>()
  const warnedDuplicateIds = new Set<string>()
  let warnedEmptyKey = false
  const warnedDuplicateKeys = new WeakMap<object, Set<string>>()
  let warnedEmptyId = false
  const keyHolders = new WeakMap<object, Map<string, Set<PopupMenuNode>>>()
  const menuScope = {}

  const scopeOf = (node: PopupMenuNode): object => {
    if (idScope === 'menu') return menuScope
    let current: PopupMenuNode | null = node.parent
    while (current) {
      if (contributesDefinitionPath(current.def)) return current
      current = current.parent
    }
    return menuScope
  }

  const warn = (message: string): void => {
    if (process.env.NODE_ENV !== 'production') console.warn(message)
  }

  const scopeLabel = (scope: object): string => {
    if (idScope === 'menu') return 'menu'
    if (scope === menuScope) return 'root surface'
    const surface = scope as PopupMenuNode
    return `surface "${surface.definitionPath.join('/')}"`
  }

  const warnDuplicateId = (node: PopupMenuNode): void => {
    if (process.env.NODE_ENV === 'production') return
    if (node.id === '') {
      if (!warnedEmptyId) {
        warnedEmptyId = true
        warn(`[PopupMenu] Empty Resolved ID for ${node.kind} definition.`)
      }
    }
    const holder = idToNode.get(node.id)
    if (!holder || holder === node) return
    if (warnedDuplicateIds.has(node.id)) return
    warnedDuplicateIds.add(node.id)
    warn(
      `[PopupMenu] Duplicate Resolved ID "${node.id}" in menu scope; ${holder.kind} and ${node.kind} definitions conflict.`,
    )
  }

  const register = (node: PopupMenuNode, scope: object = menuScope): void => {
    if (node.definitionKey === '') {
      if (!warnedEmptyKey) {
        warnedEmptyKey = true
        warn(
          `[PopupMenu] Empty Definition Key in ${node.kind} definition (${scopeLabel(scope)}).`,
        )
      }
    }
    let holdersByKey = keyHolders.get(scope)
    if (!holdersByKey) {
      holdersByKey = new Map()
      keyHolders.set(scope, holdersByKey)
    }
    let holders = holdersByKey.get(node.definitionKey)
    if (!holders) {
      holders = new Set()
      holdersByKey.set(node.definitionKey, holders)
    }
    const holder = [...holders].find((candidate) => candidate !== node)
    if (holder) {
      let warnedKeys = warnedDuplicateKeys.get(scope)
      if (!warnedKeys) {
        warnedKeys = new Set()
        warnedDuplicateKeys.set(scope, warnedKeys)
      }
      if (!warnedKeys.has(node.definitionKey)) {
        warnedKeys.add(node.definitionKey)
        warn(
          `[PopupMenu] Duplicate Definition Key "${node.definitionKey}" in ${scopeLabel(scope)}; ${holder.kind} and ${node.kind} definitions conflict.`,
        )
      }
    }
    holders.add(node)
    if (!defToNode.has(node.def)) defToNode.set(node.def, node)
    warnDuplicateId(node)
    if (!idToNode.has(node.id)) idToNode.set(node.id, node)
    const childScope =
      idScope === 'surface' && contributesDefinitionPath(node.def)
        ? node
        : scope
    for (const child of node.children) register(child, childScope)
  }

  const retire = (node: PopupMenuNode): void => {
    const scope = scopeOf(node)
    const holdersByKey = keyHolders.get(scope)
    const holders = holdersByKey?.get(node.definitionKey)
    if (holders) {
      holders.delete(node)
      if (holders.size === 0) holdersByKey?.delete(node.definitionKey)
      if (holdersByKey?.size === 0) keyHolders.delete(scope)
    }
    if (defToNode.get(node.def) === node) defToNode.delete(node.def)
    if (idToNode.get(node.id) === node) idToNode.delete(node.id)
    lastGraftDefs.delete(node)
    for (const child of node.children) retire(child)
  }

  const samePath = (left: readonly string[], right: readonly string[]) =>
    left.length === right.length &&
    left.every((part, index) => part === right[index])

  const baseOf = (node: PopupMenuNode): readonly string[] =>
    contributesDefinitionPath(node.def)
      ? node.definitionPath
      : node.parent
        ? baseOf(node.parent)
        : []

  const reconcile = (
    existing: PopupMenuNode[],
    defs: readonly NodeDef[],
    parent: PopupMenuNode | null,
    basePath: readonly string[],
  ): PopupMenuNode[] => {
    const buckets = new Map<string, PopupMenuNode[]>()
    for (const node of existing) {
      const bucket = buckets.get(node.id)
      if (bucket) bucket.push(node)
      else buckets.set(node.id, [node])
    }

    const matches: Array<PopupMenuNode | undefined> = []
    const matched = new Set<PopupMenuNode>()
    for (const [index, def] of defs.entries()) {
      const { id } = prospectiveIdentity(
        def,
        parent,
        basePath,
        index,
        getResolvedId,
      )
      const bucket = buckets.get(id)
      // Kind participates in matching (not just id): a kind mismatch must
      // not consume the candidate, so a later same-kind def can still match.
      const node = bucket?.find(
        (candidate) => !matched.has(candidate) && candidate.kind === def.kind,
      )
      if (node) {
        matched.add(node)
        matches.push(node)
      } else matches.push(undefined)
    }

    for (const node of existing) {
      if (!matched.has(node)) retire(node)
    }

    return defs.map((def, index) => {
      const node = matches[index]
      const { definitionKey, definitionPath, id } = prospectiveIdentity(
        def,
        parent,
        basePath,
        index,
        getResolvedId,
      )

      if (!node) {
        const created = resolveNodeDefs(
          [def],
          parent,
          basePath,
          getResolvedId,
        )[0]!
        created.index = index
        created.id = prospectiveIdentity(
          def,
          parent,
          basePath,
          index,
          getResolvedId,
        ).id
        register(created, scopeOf(created))
        return created
      }

      if (node.def === def && samePath(node.definitionPath, definitionPath)) {
        node.index = index
        return node
      }

      if (defToNode.get(node.def) === node) defToNode.delete(node.def)
      const oldScope = scopeOf(node)
      const oldHoldersByKey = keyHolders.get(oldScope)
      const oldHolders = oldHoldersByKey?.get(node.definitionKey)
      if (oldHolders) {
        oldHolders.delete(node)
        if (oldHolders.size === 0) {
          oldHoldersByKey?.delete(node.definitionKey)
        }
        if (oldHoldersByKey?.size === 0) keyHolders.delete(oldScope)
      }
      node.def = def
      node.definitionKey = definitionKey
      node.definitionPath = definitionPath
      node.index = index
      if (node.id !== id) {
        if (idToNode.get(node.id) === node) idToNode.delete(node.id)
        node.id = id
        warnDuplicateId(node)
        if (!idToNode.has(id)) idToNode.set(id, node)
      }
      if (!defToNode.has(def)) defToNode.set(def, node)

      lastGraftDefs.delete(node)
      node.children = reconcile(
        node.children,
        childDefsOf(def),
        node,
        contributesDefinitionPath(def) ? node.definitionPath : basePath,
      )
      register(node, scopeOf(node))
      return node
    })
  }

  return {
    getResolvedId,
    idScope,
    get rootNodes() {
      return rootNodes
    },
    setContent(defs) {
      if (defs === lastRootDefs) return
      rootNodes = reconcile(rootNodes, defs, null, [])
      lastRootDefs = defs
    },
    graft(parent, defs) {
      if (defs === lastGraftDefs.get(parent)) return
      parent.children = reconcile(parent.children, defs, parent, baseOf(parent))
      lastGraftDefs.set(parent, defs)
    },
    getNodeForDef<D extends NodeDef>(def: D) {
      // node was built from (or cached under) this exact def; def === node.def
      return defToNode.get(def) as PopupMenuNode<D> | undefined
    },
    getNodeById(id) {
      return idToNode.get(id)
    },
  }
}
