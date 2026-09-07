'use client'

import * as React from 'react'
import { useMenuTreeResolver } from '../contexts/menu-tree-resolver-context.js'
import {
  defaultGetResolvedId,
  isPopupMenuNode,
  resolveDetachedNode,
} from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import { useAsyncMenuCoordinator } from './async-coordinator.js'
import { useDataPopupContext } from './context.js'
import { warnOutOfTreeDef } from './data-list.js'
import type {
  AsyncRenderState,
  BreadcrumbNode,
  CheckboxItemDef,
  DataSubpagesChildrenState,
  DataSubpagesProps,
  DisplaySubpageNode,
  GroupRenderContext,
  ItemDef,
  NodeDef,
  QueryLoaderConfig,
  RadioGroupDef,
  RadioItemDef,
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
  nodes: NodeDef[],
  getNodeForDef: <D extends NodeDef>(def: D) => PopupMenuNode<D>,
  breadcrumbs: BreadcrumbNode[] = [],
  group: { id: string; label?: string } | null = null,
): DisplaySubpageNode[] {
  const result: DisplaySubpageNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      continue
    }

    if (node.kind === 'group') {
      result.push(
        ...collectDisplaySubpages(node.nodes, getNodeForDef, breadcrumbs, {
          id: node.id,
          label: node.label,
        }),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      if (node.hidden) continue
      result.push(
        ...collectDisplaySubpages(node.nodes, getNodeForDef, breadcrumbs, null),
      )
      continue
    }

    if (node.hidden) {
      continue
    }

    if (node.kind === 'submenu' || node.kind === 'subpage') {
      if (node.kind === 'subpage') {
        result.push({
          node: getNodeForDef(node),
          pageId: getSubpagePageId(node, breadcrumbs),
          context: {
            search: null,
            breadcrumbs,
            isDeepSearchResult: false,
            highlighted: false,
            disabled: node.disabled ?? false,
            group,
            tree: null,
          },
        })
      }

      if (node.nodes) {
        const breadcrumb: BreadcrumbNode = {
          node,
          value: node.value,
          id: node.id,
        }

        result.push(
          ...collectDisplaySubpages(
            node.nodes,
            getNodeForDef,
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

  const { dataSurfaceContext } = useDataPopupContext()
  const { resolvedContent } = useDataPopupContext()
  const resolver = useMenuTreeResolver()
  const getNodeForDefOrDetached = React.useCallback(
    <D extends NodeDef>(def: D): PopupMenuNode<D> => {
      const resolved = resolver?.getNodeForDef(def)
      if (resolved) return resolved
      warnOutOfTreeDef(def)
      const getResolvedId = resolver?.getResolvedId ?? defaultGetResolvedId
      return resolveDetachedNode(def, getResolvedId)
    },
    [resolver],
  )
  const getIdForDef = React.useCallback(
    (def: NodeDef): string => getNodeForDefOrDetached(def).id,
    [getNodeForDefOrDetached],
  )

  const content = dataSurfaceContext?.content ?? []

  const mergedContent = resolvedContent ?? content

  const subpages = React.useMemo(
    () => collectDisplaySubpages(mergedContent, getNodeForDefOrDetached),
    [mergedContent, getNodeForDefOrDetached],
  )

  const renderSubpageContent = React.useCallback(
    (displaySubpage: DisplaySubpageNode): React.ReactNode => {
      const { node: resolved, context, pageId } = displaySubpage
      const node = resolved.def

      const renderRowNode = (
        rowNode:
          | ItemDef
          | RadioItemDef
          | CheckboxItemDef
          | SubmenuDef
          | SubpageDef,
        rowContext: RowRenderContext,
      ): React.ReactNode => {
        const rowId = getIdForDef(rowNode)

        if (rowNode.kind === 'item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: getNodeForDefOrDetached(rowNode),
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
                node: getNodeForDefOrDetached(rowNode),
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
                node: getNodeForDefOrDetached(rowNode),
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
          const staticNodes = rowNode.nodes ?? []
          const submenuBreadcrumb: BreadcrumbNode = {
            node: rowNode,
            value: rowNode.value,
            id: rowNode.id,
          }

          const submenuRenderNode = (arg: NodeDef | PopupMenuNode) => {
            const childNode = isPopupMenuNode(arg) ? arg.def : arg
            if (childNode.kind === 'separator') {
              return null
            }

            if (childNode.kind === 'group') {
              const groupItems = childNode.nodes.filter(
                (n): n is ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef =>
                  (n.kind === 'item' ||
                    n.kind === 'checkbox-item' ||
                    n.kind === 'submenu' ||
                    n.kind === 'subpage') &&
                  !n.hidden,
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
                  disabled: item.disabled ?? false,
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

                return (
                  <React.Fragment key={childNode.id}>
                    {childNode.render({
                      node: getNodeForDefOrDetached(childNode),
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
              return renderRadioGroup(childNode, [
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

            return renderRowNode(childNode, {
              search: null,
              breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
              isDeepSearchResult: false,
              highlighted: false,
              disabled: childNode.disabled ?? false,
              group: null,
              tree: null,
            })
          }

          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: getNodeForDefOrDetached(rowNode),
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
                nodes: staticNodes,
                asyncContent: rowNode.asyncNodes,
                renderNode: submenuRenderNode,
              })}
            </React.Fragment>
          )
        }

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
              node: getNodeForDefOrDetached(rowNode),
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
        radioGroup: RadioGroupDef,
        breadcrumbs: BreadcrumbNode[] = [],
      ): React.ReactNode => {
        const isDeepSearchResult = breadcrumbs.length > 0

        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: radioGroup.nodes.length,
          breadcrumbs,
          isDeepSearchResult,
        }

        const childElements = radioGroup.nodes.map((item) => {
          if (item.hidden) return null

          return renderRowNode(item, {
            search: null,
            breadcrumbs,
            isDeepSearchResult,
            highlighted: false,
            disabled: item.disabled ?? false,
            group: null,
            tree: null,
          })
        })

        if (radioGroup.render) {
          return (
            <React.Fragment key={radioGroup.id}>
              {radioGroup.render({
                node: getNodeForDefOrDetached(radioGroup),
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
            nodes: node.nodes ?? [],
            asyncContent: node.asyncNodes,
            renderNode: (arg) => {
              const childNode = isPopupMenuNode(arg) ? arg.def : arg
              if (childNode.kind === 'separator') {
                return null
              }

              if (childNode.kind === 'group') {
                const groupItems = childNode.nodes.filter(
                  (
                    n,
                  ): n is ItemDef | CheckboxItemDef | SubmenuDef | SubpageDef =>
                    (n.kind === 'item' ||
                      n.kind === 'checkbox-item' ||
                      n.kind === 'submenu' ||
                      n.kind === 'subpage') &&
                    !n.hidden,
                )

                if (groupItems.length === 0) {
                  return null
                }

                const groupChildren = groupItems.map((item) =>
                  renderRowNode(item, {
                    search: null,
                    breadcrumbs: [
                      ...context.breadcrumbs,
                      {
                        node,
                        value: node.value,
                        id: node.id,
                      },
                    ],
                    isDeepSearchResult: false,
                    highlighted: false,
                    disabled: item.disabled ?? false,
                    group: { id: childNode.id, label: childNode.label },
                    tree: null,
                  }),
                )

                if (childNode.render) {
                  const groupContext: GroupRenderContext = {
                    search: null,
                    matchCount: groupItems.length,
                    breadcrumbs: [
                      ...context.breadcrumbs,
                      {
                        node,
                        value: node.value,
                        id: node.id,
                      },
                    ],
                    isDeepSearchResult: false,
                  }

                  return (
                    <React.Fragment key={childNode.id}>
                      {childNode.render({
                        node: getNodeForDefOrDetached(childNode),
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
                return renderRadioGroup(childNode, [
                  ...context.breadcrumbs,
                  {
                    node,
                    value: node.value,
                    id: node.id,
                  },
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

              return renderRowNode(childNode, {
                search: null,
                breadcrumbs: [
                  ...context.breadcrumbs,
                  {
                    node,
                    value: node.value,
                    id: node.id,
                  },
                ],
                isDeepSearchResult: false,
                highlighted: false,
                disabled: childNode.disabled ?? false,
                group: null,
                tree: null,
              })
            },
          })}
        </React.Fragment>
      )
    },
    [coordinator, searchQuery, getIdForDef],
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
