'use client'

import * as React from 'react'
import { GraftPointContext } from '../contexts/graft-point-context.js'
import { staticChildrenOf } from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import { useAsyncMenuCoordinator } from './async-coordinator.js'
import { useDataPopupContext } from './context.js'
import { isRowMenuNode } from './type-guards.js'
import type {
  AsyncRenderState,
  BreadcrumbNode,
  CheckboxItemDef,
  DataSubpagesChildrenState,
  DataSubpagesProps,
  DisplaySubpageNode,
  GroupDef,
  GroupRenderContext,
  ItemDef,
  QueryLoaderConfig,
  RadioGroupDef,
  RowNodeDef,
  RowRenderContext,
  SubmenuDef,
  SubpageDef,
} from './types.js'
import { getAsyncLoaderIdForBranch, getSubpagePageId } from './utils.js'

interface QueryExecutionState {
  effectiveQuery: string
  enabled: boolean
  isBelowMinLength: boolean
}

function resolveInitialQueryBehavior(config: QueryLoaderConfig):
  | {
      value: string
      loadWhen: 'needed' | 'parent-open'
    }
  | false {
  if (config.initialQueryBehavior !== undefined) {
    if (config.initialQueryBehavior === false) {
      return false
    }
    return {
      value: config.initialQueryBehavior.value ?? '',
      loadWhen: config.initialQueryBehavior.loadWhen ?? 'needed',
    }
  }

  if (config.initialQuery !== undefined) {
    return { value: config.initialQuery, loadWhen: 'needed' }
  }

  return { value: '', loadWhen: 'needed' }
}

function resolveQueryExecutionState(
  config: QueryLoaderConfig,
  query: string,
): QueryExecutionState {
  const minLength = config.minQueryLength ?? 1
  const initialQueryBehavior = resolveInitialQueryBehavior(config)

  if (query.length >= minLength) {
    return {
      effectiveQuery: query,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  if (initialQueryBehavior !== false) {
    return {
      effectiveQuery: initialQueryBehavior.value,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  return {
    effectiveQuery: '',
    enabled: false,
    isBelowMinLength: true,
  }
}

function getBranchAsyncState(
  node: SubmenuDef | SubpageDef,
  breadcrumbs: BreadcrumbNode[],
  searchQuery: string,
  coordinator: ReturnType<typeof useAsyncMenuCoordinator>,
): AsyncRenderState | undefined {
  if (!node.asyncNodes || !coordinator) {
    return undefined
  }

  const asyncLoaderId = getAsyncLoaderIdForBranch(node, breadcrumbs)
  const asyncResult = coordinator.loaders.get(asyncLoaderId)

  if (!asyncResult) {
    return undefined
  }

  const isBelowMinLength =
    node.asyncNodes.type === 'query'
      ? resolveQueryExecutionState(node.asyncNodes, searchQuery)
          .isBelowMinLength
      : false

  return {
    status: asyncResult.result.status,
    fetchStatus: asyncResult.result.fetchStatus,
    loadingPhase: asyncResult.result.loadingPhase,
    isLoading: asyncResult.result.isLoading,
    isFetching: asyncResult.result.isFetching,
    isInitialLoading: asyncResult.result.isInitialLoading,
    isRefetching: asyncResult.result.isRefetching,
    isError: asyncResult.result.isError,
    error: asyncResult.result.error,
    isBelowMinLength,
  }
}

function collectDisplaySubpages(
  nodes: readonly PopupMenuNode[],
  breadcrumbs: BreadcrumbNode[] = [],
  group: { id: string; label?: string } | null = null,
): DisplaySubpageNode[] {
  const result: DisplaySubpageNode[] = []

  for (const node of nodes) {
    const def = node.def
    if (def.kind === 'separator') {
      continue
    }

    if (def.kind === 'group') {
      result.push(
        ...collectDisplaySubpages(node.children, breadcrumbs, {
          id: def.id,
          label: def.label,
        }),
      )
      continue
    }

    if (def.kind === 'radio-group') {
      if (def.hidden) continue
      result.push(...collectDisplaySubpages(node.children, breadcrumbs, null))
      continue
    }

    if (def.hidden) {
      continue
    }

    if (def.kind === 'submenu' || def.kind === 'subpage') {
      if (def.kind === 'subpage') {
        result.push({
          node: node as PopupMenuNode<SubpageDef>,
          pageId: getSubpagePageId(def, breadcrumbs),
          context: {
            search: null,
            breadcrumbs,
            isDeepSearchResult: false,
            highlighted: false,
            disabled: def.disabled ?? false,
            group,
            tree: null,
          },
        })
      }

      if (node.children.length) {
        const breadcrumb: BreadcrumbNode = {
          node: def,
          menuNode: node as PopupMenuNode<SubmenuDef | SubpageDef>,
          value: def.value,
          id: def.id,
        }

        result.push(
          ...collectDisplaySubpages(
            node.children,
            [...breadcrumbs, breadcrumb],
            null,
          ),
        )
      }
    }
  }

  return result
}

export interface DataSubpagesContentProps extends DataSubpagesProps {}

/**
 * DataSubpages renders subpage content alongside the root Surface inside Popup.
 *
 * Place it as a sibling to DataSurface within Popup:
 *
 * ```tsx
 * <Popup>
 *   <DataSurface ...>
 *     ...
 *   </DataSurface>
 *   <DataSubpages />
 * </Popup>
 * ```
 */
export function DataSubpagesContent(props: DataSubpagesContentProps) {
  const { children } = props

  const coordinator = useAsyncMenuCoordinator()
  const searchQuery = coordinator?.searchQuery ?? ''

  const { dataSurfaceContext, resolvedNodes } = useDataPopupContext()
  // A retained slot is only valid while the root surface still supplies the
  // content it was published for (the root list unmounts while a subpage is
  // active, so it cannot republish on its own).
  const slot =
    resolvedNodes &&
    (!dataSurfaceContext ||
      resolvedNodes.content === dataSurfaceContext.content)
      ? resolvedNodes
      : null
  const roots = slot?.nodes ?? []
  const graftVersion = slot?.graftVersion ?? 0
  // biome-ignore lint/correctness/useExhaustiveDependencies: graftVersion signals grafts under branch nodes, which do not change `roots` identity
  const subpages = React.useMemo(
    () => collectDisplaySubpages(roots),
    [roots, graftVersion],
  )

  const renderSubpageContent = React.useCallback(
    (displaySubpage: DisplaySubpageNode): React.ReactNode => {
      const { node: resolved, context, pageId } = displaySubpage
      const node = resolved.def
      const subpageBreadcrumb: BreadcrumbNode = {
        node,
        menuNode: resolved,
        value: node.value,
        id: node.id,
      }
      const renderRowNode = (
        rowMenuNode: PopupMenuNode<RowNodeDef>,
        rowContext: RowRenderContext,
      ): React.ReactNode => {
        const rowNode = rowMenuNode.def
        const rowId = rowMenuNode.id

        if (rowNode.kind === 'item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                  onSelect: rowNode.onSelect,
                  shortcut: rowNode.shortcut,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'checkbox-item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  checked: rowNode.checked,
                  onCheckedChange: rowNode.onCheckedChange,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  checked: rowNode.checked,
                  disabled: rowNode.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'radio-item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                  onSelect: rowNode.onSelect,
                  shortcut: rowNode.shortcut,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'submenu') {
          const submenuAsyncState = getBranchAsyncState(
            rowNode,
            rowContext.breadcrumbs,
            searchQuery,
            coordinator,
          )
          const staticChildren = staticChildrenOf(rowMenuNode)
          const submenuBreadcrumb: BreadcrumbNode = {
            node: rowNode,
            menuNode: rowMenuNode as PopupMenuNode<SubmenuDef>,
            value: rowNode.value,
            id: rowNode.id,
          }

          const submenuRenderNode = (arg: PopupMenuNode) => {
            const childNode = arg.def
            if (childNode.kind === 'separator') {
              return null
            }

            if (childNode.kind === 'group') {
              const groupItems = arg.children.filter(
                (
                  n,
                ): n is PopupMenuNode<
                  ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
                > =>
                  (n.def.kind === 'item' ||
                    n.def.kind === 'checkbox-item' ||
                    n.def.kind === 'submenu' ||
                    n.def.kind === 'subpage') &&
                  !n.def.hidden,
              )

              if (groupItems.length === 0) {
                return null
              }

              const groupChildren = groupItems.map((item) =>
                renderRowNode(item, {
                  search: null,
                  breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
                  isDeepSearchResult: false,
                  highlighted: false,
                  disabled: item.def.disabled ?? false,
                  group: { id: childNode.id, label: childNode.label },
                  tree: null,
                }),
              )

              if (childNode.render) {
                const groupContext: GroupRenderContext = {
                  search: null,
                  matchCount: groupItems.length,
                  breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
                  isDeepSearchResult: false,
                }

                const groupMenuNode = arg as PopupMenuNode<GroupDef>
                return (
                  <React.Fragment key={childNode.id}>
                    {childNode.render({
                      node: groupMenuNode,
                      props: {},
                      context: {
                        ...groupContext,
                        label: childNode.label,
                      },
                      children: <>{groupChildren}</>,
                    })}
                  </React.Fragment>
                )
              }

              return (
                // biome-ignore lint/a11y/useSemanticElements: ignore for now
                <div
                  key={childNode.id}
                  role="group"
                  aria-label={childNode.label}
                >
                  {groupChildren}
                </div>
              )
            }

            if (childNode.kind === 'radio-group') {
              return renderRadioGroup(arg as PopupMenuNode<RadioGroupDef>, [
                ...rowContext.breadcrumbs,
                submenuBreadcrumb,
              ])
            }

            if (
              childNode.kind !== 'item' &&
              childNode.kind !== 'checkbox-item' &&
              childNode.kind !== 'submenu' &&
              childNode.kind !== 'subpage'
            ) {
              return null
            }

            return renderRowNode(
              arg as PopupMenuNode<
                ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
              >,
              {
                search: null,
                breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
                isDeepSearchResult: false,
                highlighted: false,
                disabled: childNode.disabled ?? false,
                group: null,
                tree: null,
              },
            )
          }

          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                  async: submenuAsyncState,
                },
                nodes: staticChildren,
                asyncContent: rowNode.asyncNodes,
                renderNode: submenuRenderNode,
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind !== 'subpage') return null

        const subpageAsyncState = getBranchAsyncState(
          rowNode,
          rowContext.breadcrumbs,
          searchQuery,
          coordinator,
        )
        const targetPageId = getSubpagePageId(rowNode, rowContext.breadcrumbs)

        return (
          <React.Fragment key={targetPageId}>
            {rowNode.renderTrigger({
              node: rowMenuNode,
              props: {
                id: rowId,
                value: rowNode.value,
                disabled: rowNode.disabled ?? false,
                targetPageId,
              },
              context: {
                ...rowContext,
                value: rowNode.value,
                disabled: rowNode.disabled ?? false,
                async: subpageAsyncState,
              },
            })}
          </React.Fragment>
        )
      }

      const renderRadioGroup = (
        radioGroupMenuNode: PopupMenuNode<RadioGroupDef>,
        breadcrumbs: BreadcrumbNode[] = [],
      ): React.ReactNode => {
        const radioGroup = radioGroupMenuNode.def
        const isDeepSearchResult = breadcrumbs.length > 0

        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: radioGroup.nodes.length,
          breadcrumbs,
          isDeepSearchResult,
        }

        const childElements = radioGroupMenuNode.children.map((item) => {
          if (!isRowMenuNode(item) || item.def.hidden) return null

          return renderRowNode(item, {
            search: null,
            breadcrumbs,
            isDeepSearchResult,
            highlighted: false,
            disabled: item.def.disabled ?? false,
            group: null,
            tree: null,
          })
        })

        if (radioGroup.render) {
          return (
            <React.Fragment key={radioGroup.id}>
              {radioGroup.render({
                node: radioGroupMenuNode,
                props: {
                  value: radioGroup.value,
                  onValueChange: radioGroup.onValueChange,
                  disabled: radioGroup.disabled ?? false,
                },
                context: {
                  ...groupContext,
                  label: radioGroup.label,
                  value: radioGroup.value,
                  disabled: radioGroup.disabled ?? false,
                },
                children: <>{childElements}</>,
              })}
            </React.Fragment>
          )
        }

        return (
          <div
            key={radioGroup.id}
            role="radiogroup"
            aria-label={radioGroup.label}
          >
            {childElements}
          </div>
        )
      }

      return (
        <React.Fragment key={pageId}>
          <GraftPointContext.Provider value={resolved}>
            {node.renderContent({
              node: resolved,
              pageId,
              context: {
                ...context,
                value: node.value,
                disabled: node.disabled ?? false,
                async: getBranchAsyncState(
                  node,
                  context.breadcrumbs,
                  searchQuery,
                  coordinator,
                ),
              },
              nodes: staticChildrenOf(resolved),
              asyncContent: node.asyncNodes,
              renderNode: (arg: PopupMenuNode) => {
                const childNode = arg.def
                if (childNode.kind === 'separator') {
                  return null
                }

                if (childNode.kind === 'group') {
                  const groupItems = arg.children.filter(
                    (
                      n,
                    ): n is PopupMenuNode<
                      ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
                    > =>
                      (n.def.kind === 'item' ||
                        n.def.kind === 'checkbox-item' ||
                        n.def.kind === 'submenu' ||
                        n.def.kind === 'subpage') &&
                      !n.def.hidden,
                  )

                  if (groupItems.length === 0) {
                    return null
                  }

                  const groupChildren = groupItems.map((item) =>
                    renderRowNode(item, {
                      search: null,
                      breadcrumbs: [...context.breadcrumbs, subpageBreadcrumb],
                      isDeepSearchResult: false,
                      highlighted: false,
                      disabled: item.def.disabled ?? false,
                      group: { id: childNode.id, label: childNode.label },
                      tree: null,
                    }),
                  )

                  if (childNode.render) {
                    const groupContext: GroupRenderContext = {
                      search: null,
                      matchCount: groupItems.length,
                      breadcrumbs: [...context.breadcrumbs, subpageBreadcrumb],
                      isDeepSearchResult: false,
                    }

                    const groupMenuNode = arg as PopupMenuNode<GroupDef>
                    return (
                      <React.Fragment key={childNode.id}>
                        {childNode.render({
                          node: groupMenuNode,
                          props: {},
                          context: {
                            ...groupContext,
                            label: childNode.label,
                          },
                          children: <>{groupChildren}</>,
                        })}
                      </React.Fragment>
                    )
                  }

                  return (
                    // biome-ignore lint/a11y/useSemanticElements: ignore for now
                    <div
                      key={childNode.id}
                      role="group"
                      aria-label={childNode.label}
                    >
                      {groupChildren}
                    </div>
                  )
                }

                if (childNode.kind === 'radio-group') {
                  return renderRadioGroup(arg as PopupMenuNode<RadioGroupDef>, [
                    ...context.breadcrumbs,
                    subpageBreadcrumb,
                  ])
                }

                if (
                  childNode.kind !== 'item' &&
                  childNode.kind !== 'checkbox-item' &&
                  childNode.kind !== 'submenu' &&
                  childNode.kind !== 'subpage'
                ) {
                  return null
                }

                return renderRowNode(
                  arg as PopupMenuNode<
                    ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
                  >,
                  {
                    search: null,
                    breadcrumbs: [...context.breadcrumbs, subpageBreadcrumb],
                    isDeepSearchResult: false,
                    highlighted: false,
                    disabled: childNode.disabled ?? false,
                    group: null,
                    tree: null,
                  },
                )
              },
            })}
          </GraftPointContext.Provider>
        </React.Fragment>
      )
    },
    [coordinator, searchQuery],
  )

  if (!dataSurfaceContext) {
    return null
  }

  const childrenState: DataSubpagesChildrenState = {
    subpages,
    renderSubpageContent,
  }

  if (children) {
    return <>{children(childrenState)}</>
  }

  return <>{subpages.map(renderSubpageContent)}</>
}
