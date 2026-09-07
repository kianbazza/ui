// ============================================================================
// Dropdown Menu Exports
// ============================================================================

// Namespace export
export * as DropdownMenu from './index.parts.js'

// ============================================================================
// Dropdown-menu specific components
// ============================================================================

// Root
export type { DropdownMenuRoot, DropdownMenuRootProps } from './root/root.js'

// Trigger
export { DropdownMenuTriggerDataAttributes } from './trigger/trigger.data-attrs.js'
export type {
  DropdownMenuTrigger,
  DropdownMenuTriggerProps,
} from './trigger/trigger.js'

// ============================================================================
// Re-exported from internal/popup-menu (with DropdownMenu prefix)
// ============================================================================

// Portal
// Submenu
// Surface
// List
// Input
// Empty
// Group
// Group Label
// Separator
export type {
  PopupMenuArrow as DropdownMenuArrow,
  PopupMenuArrowProps as DropdownMenuArrowProps,
  PopupMenuBackdrop as DropdownMenuBackdrop,
  PopupMenuBackdropProps as DropdownMenuBackdropProps,
  PopupMenuCheckboxItem as DropdownMenuCheckboxItem,
  PopupMenuCheckboxItemIndicator as DropdownMenuCheckboxItemIndicator,
  PopupMenuCheckboxItemIndicatorProps as DropdownMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState as DropdownMenuCheckboxItemIndicatorState,
  PopupMenuCheckboxItemProps as DropdownMenuCheckboxItemProps,
  PopupMenuCheckboxItemState as DropdownMenuCheckboxItemState,
  PopupMenuEmpty as DropdownMenuEmpty,
  PopupMenuEmptyProps as DropdownMenuEmptyProps,
  PopupMenuEmptyState as DropdownMenuEmptyState,
  PopupMenuFocusZone as DropdownMenuFocusZone,
  PopupMenuFocusZoneProps as DropdownMenuFocusZoneProps,
  PopupMenuFocusZoneState as DropdownMenuFocusZoneState,
  PopupMenuFooter as DropdownMenuFooter,
  PopupMenuFooterProps as DropdownMenuFooterProps,
  PopupMenuFooterState as DropdownMenuFooterState,
  PopupMenuGroup as DropdownMenuGroup,
  PopupMenuGroupLabel as DropdownMenuGroupLabel,
  PopupMenuGroupLabelProps as DropdownMenuGroupLabelProps,
  PopupMenuGroupLabelState as DropdownMenuGroupLabelState,
  PopupMenuGroupProps as DropdownMenuGroupProps,
  PopupMenuGroupState as DropdownMenuGroupState,
  PopupMenuHeader as DropdownMenuHeader,
  PopupMenuHeaderProps as DropdownMenuHeaderProps,
  PopupMenuHeaderState as DropdownMenuHeaderState,
  PopupMenuIcon as DropdownMenuIcon,
  PopupMenuIconProps as DropdownMenuIconProps,
  PopupMenuIconState as DropdownMenuIconState,
  PopupMenuInput as DropdownMenuInput,
  PopupMenuInputProps as DropdownMenuInputProps,
  PopupMenuInputState as DropdownMenuInputState,
  PopupMenuItem as DropdownMenuItem,
  PopupMenuItemProps as DropdownMenuItemProps,
  PopupMenuItemState as DropdownMenuItemState,
  PopupMenuList as DropdownMenuList,
  PopupMenuListChildrenState as DropdownMenuListChildrenState,
  PopupMenuListProps as DropdownMenuListProps,
  PopupMenuListState as DropdownMenuListState,
  PopupMenuLoading as DropdownMenuLoading,
  PopupMenuLoadingProps as DropdownMenuLoadingProps,
  PopupMenuLoadingState as DropdownMenuLoadingState,
  PopupMenuPopup as DropdownMenuPopup,
  PopupMenuPopupProps as DropdownMenuPopupProps,
  PopupMenuPortal as DropdownMenuPortal,
  PopupMenuPortalProps as DropdownMenuPortalProps,
  PopupMenuPositioner as DropdownMenuPositioner,
  PopupMenuPositionerAlign as DropdownMenuPositionerAlign,
  PopupMenuPositionerProps as DropdownMenuPositionerProps,
  PopupMenuRadioGroup as DropdownMenuRadioGroup,
  PopupMenuRadioGroupProps as DropdownMenuRadioGroupProps,
  PopupMenuRadioGroupState as DropdownMenuRadioGroupState,
  PopupMenuRadioItem as DropdownMenuRadioItem,
  PopupMenuRadioItemIndicator as DropdownMenuRadioItemIndicator,
  PopupMenuRadioItemIndicatorProps as DropdownMenuRadioItemIndicatorProps,
  PopupMenuRadioItemIndicatorState as DropdownMenuRadioItemIndicatorState,
  PopupMenuRadioItemProps as DropdownMenuRadioItemProps,
  PopupMenuRadioItemState as DropdownMenuRadioItemState,
  PopupMenuScrollArrowProps as DropdownMenuScrollArrowProps,
  PopupMenuScrollArrowState as DropdownMenuScrollArrowState,
  PopupMenuScrollDownArrowProps as DropdownMenuScrollDownArrowProps,
  PopupMenuScrollUpArrowProps as DropdownMenuScrollUpArrowProps,
  PopupMenuSeparator as DropdownMenuSeparator,
  PopupMenuSeparatorProps as DropdownMenuSeparatorProps,
  PopupMenuSeparatorState as DropdownMenuSeparatorState,
  PopupMenuShortcut as DropdownMenuShortcut,
  PopupMenuShortcutProps as DropdownMenuShortcutProps,
  PopupMenuShortcutState as DropdownMenuShortcutState,
  PopupMenuSubmenuRoot as DropdownMenuSubmenuRoot,
  PopupMenuSubmenuRootProps as DropdownMenuSubmenuRootProps,
  PopupMenuSubmenuTrigger as DropdownMenuSubmenuTrigger,
  PopupMenuSubmenuTriggerIndicator as DropdownMenuSubmenuTriggerIndicator,
  PopupMenuSubmenuTriggerIndicatorProps as DropdownMenuSubmenuTriggerIndicatorProps,
  PopupMenuSubmenuTriggerIndicatorState as DropdownMenuSubmenuTriggerIndicatorState,
  PopupMenuSubmenuTriggerProps as DropdownMenuSubmenuTriggerProps,
  PopupMenuSubmenuTriggerState as DropdownMenuSubmenuTriggerState,
  PopupMenuSubpage as DropdownMenuSubpage,
  PopupMenuSubpageBack as DropdownMenuSubpageBack,
  PopupMenuSubpageBackItem as DropdownMenuSubpageBackItem,
  PopupMenuSubpageBackItemProps as DropdownMenuSubpageBackItemProps,
  PopupMenuSubpageBackItemState as DropdownMenuSubpageBackItemState,
  PopupMenuSubpageBackProps as DropdownMenuSubpageBackProps,
  PopupMenuSubpageBackState as DropdownMenuSubpageBackState,
  PopupMenuSubpageProps as DropdownMenuSubpageProps,
  PopupMenuSubpageTrigger as DropdownMenuSubpageTrigger,
  PopupMenuSubpageTriggerProps as DropdownMenuSubpageTriggerProps,
  PopupMenuSubpageTriggerState as DropdownMenuSubpageTriggerState,
  PopupMenuSurface as DropdownMenuSurface,
  PopupMenuSurfaceProps as DropdownMenuSurfaceProps,
  PopupMenuSurfaceState as DropdownMenuSurfaceState,
} from '../internal/popup-menu/index.js'
// CSS variables (still from popup-menu as they don't have component-specific values)
export {
  PopupMenuListCssVars as DropdownMenuListCssVars,
  PopupMenuPositionerCssVars as DropdownMenuPositionerCssVars,
} from '../internal/popup-menu/index.js'

// Data attributes with component-specific bazzaui-* selectors
export { DropdownMenuArrowDataAttributes } from './arrow/arrow.data-attrs.js'
export { DropdownMenuBackdropDataAttributes } from './backdrop/backdrop.data-attrs.js'
export {
  DropdownMenuCheckboxItemDataAttributes,
  DropdownMenuCheckboxItemIndicatorDataAttributes,
} from './checkbox-item/checkbox-item.data-attrs.js'
export { DropdownMenuEmptyDataAttributes } from './empty/empty.data-attrs.js'
export { DropdownMenuGroupDataAttributes } from './group/group.data-attrs.js'
export { DropdownMenuGroupLabelDataAttributes } from './group-label/group-label.data-attrs.js'
export { DropdownMenuIconDataAttributes } from './icon/icon.data-attrs.js'
export { DropdownMenuInputDataAttributes } from './input/input.data-attrs.js'
export { DropdownMenuItemDataAttributes } from './item/item.data-attrs.js'
export { DropdownMenuListDataAttributes } from './list/list.data-attrs.js'
export { DropdownMenuLoadingDataAttributes } from './loading/loading.data-attrs.js'
export { DropdownMenuPopupDataAttributes } from './popup/popup.data-attrs.js'
export { DropdownMenuPositionerDataAttributes } from './positioner/positioner.data-attrs.js'
export { DropdownMenuRadioGroupDataAttributes } from './radio-group/radio-group.data-attrs.js'
export {
  DropdownMenuRadioItemDataAttributes,
  DropdownMenuRadioItemIndicatorDataAttributes,
} from './radio-item/radio-item.data-attrs.js'
export { DropdownMenuScrollArrowDataAttributes } from './scroll-arrow/scroll-arrow.data-attrs.js'
export { DropdownMenuSeparatorDataAttributes } from './separator/separator.data-attrs.js'
export { DropdownMenuShortcutDataAttributes } from './shortcut/shortcut.data-attrs.js'
export {
  DropdownMenuSubmenuTriggerDataAttributes,
  DropdownMenuSubmenuTriggerIndicatorDataAttributes,
} from './submenu-trigger/submenu-trigger.data-attrs.js'
export { DropdownMenuSubpageBackDataAttributes } from './subpage-back/subpage-back.data-attrs.js'
export { DropdownMenuSubpageBackItemDataAttributes } from './subpage-back-item/subpage-back-item.data-attrs.js'
export { DropdownMenuSubpageTriggerDataAttributes } from './subpage-trigger/subpage-trigger.data-attrs.js'
export { DropdownMenuSurfaceDataAttributes } from './surface/surface.data-attrs.js'

// ============================================================================
// Context hooks (for advanced usage)
// ============================================================================

export type {
  ItemContextValue,
  SurfaceContextValue,
} from '../internal/listbox/index.js'
export {
  useItemContext,
  useMaybeItemContext,
  useMaybeSurfaceContext,
  useSurfaceContext,
} from '../internal/listbox/index.js'
export type {
  PopupMenuContextValue as RootContextValue,
  SubmenuContextValue,
  SubpageContextValue,
  SubpageStackContextValue,
} from '../internal/popup-menu/index.js'
export {
  useMaybePopupMenuContext as useMaybeRootContext,
  useMaybeSubmenuContext,
  useMaybeSubpageContext,
  useMaybeSubpageStack,
  usePopupMenuContext as useRootContext,
  useSubmenuContext,
  useSubpageContext,
  useSubpageStack,
} from '../internal/popup-menu/index.js'

// ============================================================================
// Store (for advanced usage)
// ============================================================================

export type {
  FilterFn as DropdownMenuFilterFn,
  ItemRegistration as DropdownMenuItemRegistration,
  ListboxContext as DropdownMenuStoreContext,
  ListboxState as DropdownMenuStoreState,
  VirtualItem as DropdownMenuVirtualItem,
} from '../internal/listbox/index.js'
export { ListboxStore as DropdownMenuStore } from '../internal/listbox/index.js'

// ============================================================================
// Filter utilities
// ============================================================================

export { commandScore, defaultFilter } from '../internal/listbox/index.js'

// ============================================================================
// Hook for custom items (for advanced usage)
// ============================================================================

export type {
  UsePopupMenuItemParams as UseItemParams,
  UsePopupMenuItemReturn as UseItemReturn,
} from '../internal/popup-menu/index.js'
export { usePopupMenuItem as useItem } from '../internal/popup-menu/index.js'

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
  // Async coordinator
  AsyncMenuCoordinatorValue,
  AsyncNodesConfig,
  AsyncRenderState,
  // Async types
  AsyncResultBehavior,
  AsyncState,
  // ID generation types
  BreadcrumbNode,
  // Node types
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
  GroupLabelRenderParams,
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
  PopupMenuRadioGroupValueProps as DropdownMenuRadioGroupValueProps,
  QueryAsyncNodesConfig,
  QueryLoaderConfig,
  RadioGroupBehavior,
  RadioGroupDef,
  RadioGroupLabelRenderParams,
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
  TreeItemDef,
  TreeItemRenderParams,
  TreeItemRenderProps,
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
  isTreeItemDef,
  PopupMenuRadioGroupValue as DropdownMenuRadioGroupValue,
  useAsyncMenuCoordinator,
  useDataList,
  useDataSurfaceContext,
  useMaybeAsyncMenuCoordinator,
  useMaybeDataList,
  useMaybeDataSurfaceContext,
} from '../internal/popup-menu/index.js'
