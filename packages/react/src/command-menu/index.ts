// ============================================================================
// Command Menu Exports
// ============================================================================

export type { SurfaceContextValue } from '../internal/listbox/index.js'
export {
  useMaybeSurfaceContext,
  useSurfaceContext,
} from '../internal/listbox/index.js'
export type {
  PopupMenuCheckboxItemIndicatorProps as CommandMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState as CommandMenuCheckboxItemIndicatorState,
  PopupMenuCheckboxItemProps as CommandMenuCheckboxItemProps,
  PopupMenuCheckboxItemState as CommandMenuCheckboxItemState,
  PopupMenuEmptyProps as CommandMenuEmptyProps,
  PopupMenuEmptyState as CommandMenuEmptyState,
  PopupMenuFocusZone as CommandMenuFocusZone,
  PopupMenuFocusZoneProps as CommandMenuFocusZoneProps,
  PopupMenuFocusZoneState as CommandMenuFocusZoneState,
  PopupMenuFooter as CommandMenuFooter,
  PopupMenuFooterProps as CommandMenuFooterProps,
  PopupMenuFooterState as CommandMenuFooterState,
  PopupMenuGroupLabelProps as CommandMenuGroupLabelProps,
  PopupMenuGroupLabelState as CommandMenuGroupLabelState,
  PopupMenuGroupProps as CommandMenuGroupProps,
  PopupMenuGroupState as CommandMenuGroupState,
  PopupMenuHeader as CommandMenuHeader,
  PopupMenuHeaderProps as CommandMenuHeaderProps,
  PopupMenuHeaderState as CommandMenuHeaderState,
  PopupMenuIconProps as CommandMenuIconProps,
  PopupMenuIconState as CommandMenuIconState,
  PopupMenuItemProps as CommandMenuItemProps,
  PopupMenuItemState as CommandMenuItemState,
  PopupMenuListChildrenState as CommandMenuListChildrenState,
  PopupMenuListProps as CommandMenuListProps,
  PopupMenuListState as CommandMenuListState,
  PopupMenuLoadingProps as CommandMenuLoadingProps,
  PopupMenuLoadingState as CommandMenuLoadingState,
  PopupMenuSeparatorProps as CommandMenuSeparatorProps,
  PopupMenuSeparatorState as CommandMenuSeparatorState,
  PopupMenuShortcutProps as CommandMenuShortcutProps,
  PopupMenuShortcutState as CommandMenuShortcutState,
  PopupMenuSubpageBackItemProps as CommandMenuSubpageBackItemProps,
  PopupMenuSubpageBackItemState as CommandMenuSubpageBackItemState,
  PopupMenuSubpageBackProps as CommandMenuSubpageBackProps,
  PopupMenuSubpageBackState as CommandMenuSubpageBackState,
  PopupMenuSubpageTriggerProps as CommandMenuSubpageTriggerProps,
  PopupMenuSubpageTriggerState as CommandMenuSubpageTriggerState,
  PopupMenuSurfaceProps as CommandMenuSurfaceProps,
  PopupMenuSurfaceState as CommandMenuSurfaceState,
} from '../internal/popup-menu/index.js'

// ============================================================================
// Deep Search (Data-First API)
// ============================================================================

export type {
  AsyncLoaderConfig,
  AsyncLoaderFetchStatus,
  AsyncLoaderLoadingPhase,
  AsyncLoaderResult,
  AsyncLoaderSource,
  AsyncLoaderStatus,
  AsyncMenuCoordinatorValue,
  AsyncNodesConfig,
  AsyncRenderState,
  AsyncResultBehavior,
  AsyncState,
  BreadcrumbNode,
  CheckboxItemDef,
  CheckboxItemRenderParams,
  CheckboxItemRenderProps,
  DataListChildrenState,
  DataSurfaceContextValue,
  DeepSearchConfig,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  DisplaySeparatorNode,
  DisplaySubpageNode,
  GetResolvedIdFn,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  GroupRenderParams,
  IncludeInDeepSearch,
  InitialQueryBehavior,
  ItemDef,
  ItemRenderParams,
  ItemRenderProps,
  LoaderComponentProps,
  NodeDef,
  PopupMenuIdScope,
  PopupMenuNode,
  PopupMenuRadioGroupValueProps as CommandMenuRadioGroupValueProps,
  QueryAsyncNodesConfig,
  QueryLoaderConfig,
  RadioGroupBehavior,
  RadioGroupDef,
  RadioGroupRenderParams,
  RadioGroupRenderProps,
  RadioItemDef,
  RadioItemRenderParams,
  RadioItemRenderProps,
  RenderNodeFn,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SeparatorRenderParams,
  StaticAsyncNodesConfig,
  StaticLoaderConfig,
  SubmenuDef,
  SubmenuRenderParams,
  SubmenuRenderProps,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
  SubpageTriggerRenderProps,
  UnresolvedMenuNode,
} from '../internal/popup-menu/index.js'
export {
  DataListContext,
  DataSurfaceContext,
  defaultGetResolvedId,
  defineRadioGroup,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  isDisplaySeparatorNode,
  isPopupMenuNode,
  PopupMenuRadioGroupValue as CommandMenuRadioGroupValue,
  useAsyncMenuCoordinator,
  useDataList,
  useDataSurfaceContext,
  useMaybeAsyncMenuCoordinator,
  useMaybeDataList,
  useMaybeDataSurfaceContext,
} from '../internal/popup-menu/index.js'

export type {
  CommandMenuBackdropProps,
  CommandMenuBackdropState,
} from './backdrop/backdrop.js'
export * as CommandMenu from './index.parts.js'
export type {
  CommandMenuInputProps,
  CommandMenuInputState,
} from './input/input.js'
export type {
  CommandMenuPopupProps,
  CommandMenuPopupState,
} from './popup/popup.js'
export type {
  CommandMenuPortalProps,
  CommandMenuPortalState,
} from './portal/portal.js'
export type { CommandMenuRootProps } from './root/root.js'
export type { CommandMenuSubpageProps } from './subpage/subpage.js'
export type {
  CommandMenuTriggerProps,
  CommandMenuTriggerState,
} from './trigger/trigger.js'
