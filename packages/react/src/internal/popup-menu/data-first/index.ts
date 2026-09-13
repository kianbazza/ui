// ============================================================================
// Data-First Module
// ============================================================================
// Data-first API for popup menus with deep search support.

export type {
  DataPopupContextValue,
  DataSurfaceContextValue,
  RenderNodeFn,
} from './context.js'

// Context
export {
  DataListContext,
  DataPopupContext,
  DataSurfaceContext,
  useDataList,
  useDataPopupContext,
  useDataSurfaceContext,
  useMaybeDataList,
  useMaybeDataPopupContext,
  useMaybeDataSurfaceContext,
} from './context.js'
// Types
export type {
  AsyncResultBehavior,
  BreadcrumbNode,
  CheckboxItemDef,
  CheckboxItemRenderParams,
  CheckboxItemRenderProps,
  DataListChildrenState,
  DeepSearchConfig,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  DisplaySeparatorNode,
  DisplaySubpageNode,
  GroupBehavior,
  GroupDef,
  GroupLabelRenderParams,
  GroupRenderContext,
  GroupRenderParams,
  IncludeInDeepSearch,
  InitialQueryBehavior,
  ItemDef,
  ItemRenderParams,
  ItemRenderProps,
  NodeDef,
  RadioGroupDef,
  RadioGroupLabelRenderParams,
  RadioGroupRenderParams,
  RadioGroupRenderProps,
  RadioItemDef,
  RadioItemRenderParams,
  RadioItemRenderProps,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SeparatorRenderParams,
  SubmenuDef,
  SubmenuRenderParams,
  SubmenuRenderProps,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
  SubpageTriggerRenderProps,
  TreeItemDef,
  TreeItemRenderParams,
  TreeItemRenderProps,
} from './types.js'
export {
  defineRadioGroup,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  isDisplaySeparatorNode,
} from './types.js'
export type { FilterNodesOptions } from './utils.js'
// Utilities
export {
  buildDisplayRowNodes,
  deduplicateNodes,
  filterNodes,
  flattenNodes,
  getBrowseNodesFlatten,
  getBrowseNodesPreserve,
  getSubpagePageId,
  isCheckboxItemDef,
  isGroupDef,
  isItemDef,
  isRadioGroupDef,
  isRadioItemDef,
  isSeparatorDef,
  isSubmenuDef,
  isSubpageDef,
  isTreeItemDef,
  partitionByKind,
  scoreNodes,
  shouldIncludeInDeepSearch,
  shouldIncludeSubmenuRowsInDeepSearch,
  shouldLoadEagerly,
  sortByScore,
} from './utils.js'
