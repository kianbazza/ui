// ============================================================================
// Internal Popup Menu Package
// ============================================================================
// Shared behavior for popup-based menus with submenus.
// Used by: DropdownMenu, ContextMenu

// Contexts
export { useFocusOwner } from './contexts/focus-owner-context.js'
export { useOpenChain } from './contexts/open-chain-context.js'
export type {
  PopupMenuContextValue,
  VirtualAnchor,
  VirtualItem,
  VirtualizationConfig,
} from './contexts/popup-menu-context.js'
// Core Context
export {
  PopupMenuContext,
  useMaybePopupMenuContext,
  usePopupMenuContext,
} from './contexts/popup-menu-context.js'
export type { PopupMenuDebugOptions } from './contexts/popup-menu-debug-context.js'
export { PopupSurfaceIdContext } from './contexts/popup-surface-id-context.js'
export type { SubmenuContextValue } from './contexts/submenu-context.js'
export {
  useMaybeSubmenuContext,
  useSubmenuContext,
} from './contexts/submenu-context.js'
export type { SubpageContextValue } from './contexts/subpage-context.js'
export {
  useMaybeSubpageContext,
  useSubpageContext,
} from './contexts/subpage-context.js'
export type { SubpageStackContextValue } from './contexts/subpage-stack-context.js'
export {
  SubpageStackContext,
  useMaybeSubpageStack,
  useSubpageStack,
} from './contexts/subpage-stack-context.js'
// Hooks
// Stores
export { FocusOwnerStore } from './store/FocusOwnerStore.js'
// Utils

// ============================================================================
// Shared Hooks
// ============================================================================

export type {
  PopupMenuRootActions,
  UsePopupMenuRootParams,
} from './hooks/use-popup-menu-root.js'
export { usePopupMenuRoot } from './hooks/use-popup-menu-root.js'
export { useSubpageStackState } from './hooks/use-subpage-stack-state.js'

// ============================================================================
// Shared Components
// ============================================================================

export type { PopupMenuArrowProps } from './components/arrow/arrow.js'
export { PopupMenuArrow } from './components/arrow/arrow.js'
export type { PopupMenuBackdropProps } from './components/backdrop/backdrop.js'
export { PopupMenuBackdrop } from './components/backdrop/backdrop.js'
export { PopupMenuPopupDataAttributes } from './components/popup/popup.data-attrs.js'
export type {
  PopupMenuPopupProps,
  PopupMenuPopupState,
} from './components/popup/popup.js'
export { PopupMenuPopup } from './components/popup/popup.js'
export type { PopupMenuPortalProps } from './components/portal/portal.js'
export { PopupMenuPortal } from './components/portal/portal.js'
export { PopupMenuPositionerCssVars } from './components/positioner/positioner.css-vars.js'
export type {
  PopupMenuPositionerAlign,
  PopupMenuPositionerProps,
} from './components/positioner/positioner.js'
export { PopupMenuPositioner } from './components/positioner/positioner.js'
export { PopupMenuProviders } from './components/providers.js'

// ============================================================================
// Item Hooks
// ============================================================================

export type {
  UsePopupMenuItemParams,
  UsePopupMenuItemReturn,
} from './hooks/use-popup-menu-item.js'
export { usePopupMenuItem } from './hooks/use-popup-menu-item.js'
export { usePopupMenuKeyboard } from './hooks/use-popup-menu-keyboard.js'

// ============================================================================
// Trigger Components
// ============================================================================

export type {
  PopupMenuIconProps,
  PopupMenuIconState,
} from './components/icon/icon.js'
export { PopupMenuIcon } from './components/icon/icon.js'

// ============================================================================
// Content Components
// ============================================================================

export type {
  PopupMenuEmptyProps,
  PopupMenuEmptyState,
} from './components/empty/empty.js'
export { PopupMenuEmpty } from './components/empty/empty.js'
export type {
  PopupMenuInputProps,
  PopupMenuInputState,
} from './components/input/input.js'
export { PopupMenuInput } from './components/input/input.js'
export type {
  PopupMenuListChildrenState,
  PopupMenuListProps,
  PopupMenuListState,
} from './components/list/list.js'
export {
  PopupMenuList,
  PopupMenuListCssVars,
} from './components/list/list.js'
export type {
  PopupMenuLoadingProps,
  PopupMenuLoadingState,
} from './components/loading/loading.js'
export { PopupMenuLoading } from './components/loading/loading.js'
export type {
  PopupMenuScrollArrowProps,
  PopupMenuScrollArrowState,
  PopupMenuScrollDownArrowProps,
  PopupMenuScrollUpArrowProps,
} from './components/scroll-arrow/scroll-arrow.js'
export {
  PopupMenuScrollDownArrow,
  PopupMenuScrollUpArrow,
} from './components/scroll-arrow/scroll-arrow.js'
export type {
  PopupMenuSurfaceProps,
  PopupMenuSurfaceState,
} from './components/surface/surface.js'
export { PopupMenuSurface } from './components/surface/surface.js'

// ============================================================================
// Item Components
// ============================================================================

export type {
  PopupMenuCheckboxItemProps,
  PopupMenuCheckboxItemState,
} from './components/checkbox-item/checkbox-item.js'
export { PopupMenuCheckboxItem } from './components/checkbox-item/checkbox-item.js'
export type {
  PopupMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState,
} from './components/checkbox-item/checkbox-item-indicator.js'
export { PopupMenuCheckboxItemIndicator } from './components/checkbox-item/checkbox-item-indicator.js'
export type {
  PopupMenuItemProps,
  PopupMenuItemState,
} from './components/item/item.js'
export { PopupMenuItem } from './components/item/item.js'
export type {
  PopupMenuRadioGroupProps,
  PopupMenuRadioGroupState,
} from './components/radio-group/radio-group.js'
export { PopupMenuRadioGroup } from './components/radio-group/radio-group.js'
export type { PopupMenuRadioGroupValueProps } from './components/radio-group/radio-group-value.js'
export { PopupMenuRadioGroupValue } from './components/radio-group/radio-group-value.js'
export type {
  PopupMenuRadioItemProps,
  PopupMenuRadioItemState,
} from './components/radio-item/radio-item.js'
export { PopupMenuRadioItem } from './components/radio-item/radio-item.js'
export type {
  PopupMenuRadioItemIndicatorProps,
  PopupMenuRadioItemIndicatorState,
} from './components/radio-item/radio-item-indicator.js'
export { PopupMenuRadioItemIndicator } from './components/radio-item/radio-item-indicator.js'

// ============================================================================
// Structure Components
// ============================================================================

export type {
  PopupMenuFocusZoneProps,
  PopupMenuFocusZoneState,
} from './components/focus-zone/focus-zone.js'
export { PopupMenuFocusZone } from './components/focus-zone/focus-zone.js'
export type {
  PopupMenuFooterProps,
  PopupMenuFooterState,
} from './components/footer/footer.js'
export { PopupMenuFooter } from './components/footer/footer.js'
export type {
  PopupMenuGroupProps,
  PopupMenuGroupState,
} from './components/group/group.js'
export { PopupMenuGroup } from './components/group/group.js'
export { PopupMenuGroupValue } from './components/group/group-value.js'
export type {
  PopupMenuGroupLabelProps,
  PopupMenuGroupLabelState,
} from './components/group-label/group-label.js'
export { PopupMenuGroupLabel } from './components/group-label/group-label.js'
export type {
  PopupMenuHeaderProps,
  PopupMenuHeaderState,
} from './components/header/header.js'
export { PopupMenuHeader } from './components/header/header.js'
export type {
  PopupMenuSeparatorProps,
  PopupMenuSeparatorState,
} from './components/separator/separator.js'
export { PopupMenuSeparator } from './components/separator/separator.js'
export type {
  PopupMenuShortcutProps,
  PopupMenuShortcutState,
} from './components/shortcut/shortcut.js'
export { PopupMenuShortcut } from './components/shortcut/shortcut.js'
export { PopupMenuTree } from './components/tree/tree.js'
export { PopupMenuTreeConnector } from './components/tree/tree-connector.js'
export { PopupMenuTreeItem } from './components/tree/tree-item.js'

// ============================================================================
// Submenu Components
// ============================================================================

export type { PopupMenuSubmenuRootProps } from './components/submenu-root/submenu-root.js'
export { PopupMenuSubmenuRoot } from './components/submenu-root/submenu-root.js'
export type {
  PopupMenuSubmenuTriggerProps,
  PopupMenuSubmenuTriggerState,
} from './components/submenu-trigger/submenu-trigger.js'
export { PopupMenuSubmenuTrigger } from './components/submenu-trigger/submenu-trigger.js'
export type {
  PopupMenuSubmenuTriggerIndicatorProps,
  PopupMenuSubmenuTriggerIndicatorState,
} from './components/submenu-trigger/submenu-trigger-indicator.js'
export { PopupMenuSubmenuTriggerIndicator } from './components/submenu-trigger/submenu-trigger-indicator.js'
export type { PopupMenuSubpageProps } from './components/subpage/subpage.js'
export { PopupMenuSubpage } from './components/subpage/subpage.js'
export type {
  PopupMenuSubpageBackProps,
  PopupMenuSubpageBackState,
} from './components/subpage-back/subpage-back.js'
export { PopupMenuSubpageBack } from './components/subpage-back/subpage-back.js'
export type {
  PopupMenuSubpageBackItemProps,
  PopupMenuSubpageBackItemState,
} from './components/subpage-back-item/subpage-back-item.js'
export { PopupMenuSubpageBackItem } from './components/subpage-back-item/subpage-back-item.js'
export type {
  PopupMenuSubpageTriggerProps,
  PopupMenuSubpageTriggerState,
} from './components/subpage-trigger/subpage-trigger.js'
export { PopupMenuSubpageTrigger } from './components/subpage-trigger/subpage-trigger.js'

// ============================================================================
// Deep Search (Data-First API)
// ============================================================================

// Async Coordinator
export type { AsyncMenuCoordinatorValue } from './deep-search/async-coordinator.js'
export {
  useAsyncMenuCoordinator,
  useMaybeAsyncMenuCoordinator,
} from './deep-search/async-coordinator.js'
// Context
export type {
  DataSurfaceContextValue,
  RenderNodeFn,
} from './deep-search/context.js'
export {
  DataListContext,
  DataPopupContext,
  DataSurfaceContext,
  useDataList,
  useDataSurfaceContext,
  useMaybeDataList,
  useMaybeDataSurfaceContext,
} from './deep-search/context.js'
// Types
export type {
  AsyncLoaderConfig,
  AsyncLoaderFetchStatus,
  AsyncLoaderLoadingPhase,
  AsyncLoaderResult,
  AsyncLoaderSource,
  AsyncLoaderStatus,
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
  LoaderComponentProps,
  NodeDef,
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
} from './deep-search/types.js'
export {
  defineRadioGroup,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  isDisplaySeparatorNode,
} from './deep-search/types.js'

// Utilities
export { isTreeItemDef } from './deep-search/utils.js'
export type { PopupMenuHighlightChangeHandler } from './events.js'
export { defaultGetResolvedId, isPopupMenuNode } from './menu-tree/resolve.js'
export type { MenuTreeResolver } from './menu-tree/resolver.js'
export type {
  GetResolvedIdFn,
  PopupMenuNode,
  UnresolvedMenuNode,
} from './menu-tree/types.js'
