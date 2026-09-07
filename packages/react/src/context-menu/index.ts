// ============================================================================
// Context Menu Exports
// ============================================================================

// Namespace export
export * as ContextMenu from './index.parts.js'

// ============================================================================
// Context-menu specific components
// ============================================================================

// Root
export type { ContextMenuRoot, ContextMenuRootProps } from './root/root.js'

// Trigger
export { ContextMenuTriggerDataAttributes } from './trigger/trigger.data-attrs.js'
export type {
  ContextMenuTrigger,
  ContextMenuTriggerProps,
  ContextMenuTriggerState,
} from './trigger/trigger.js'

// ============================================================================
// Re-exported from internal/popup-menu (with ContextMenu prefix)
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
  PopupMenuArrow as ContextMenuArrow,
  PopupMenuArrowProps as ContextMenuArrowProps,
  PopupMenuBackdrop as ContextMenuBackdrop,
  PopupMenuBackdropProps as ContextMenuBackdropProps,
  PopupMenuCheckboxItem as ContextMenuCheckboxItem,
  PopupMenuCheckboxItemIndicator as ContextMenuCheckboxItemIndicator,
  PopupMenuCheckboxItemIndicatorProps as ContextMenuCheckboxItemIndicatorProps,
  PopupMenuCheckboxItemIndicatorState as ContextMenuCheckboxItemIndicatorState,
  PopupMenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  PopupMenuCheckboxItemState as ContextMenuCheckboxItemState,
  PopupMenuEmpty as ContextMenuEmpty,
  PopupMenuEmptyProps as ContextMenuEmptyProps,
  PopupMenuEmptyState as ContextMenuEmptyState,
  PopupMenuFocusZone as ContextMenuFocusZone,
  PopupMenuFocusZoneProps as ContextMenuFocusZoneProps,
  PopupMenuFocusZoneState as ContextMenuFocusZoneState,
  PopupMenuFooter as ContextMenuFooter,
  PopupMenuFooterProps as ContextMenuFooterProps,
  PopupMenuFooterState as ContextMenuFooterState,
  PopupMenuGroup as ContextMenuGroup,
  PopupMenuGroupLabel as ContextMenuGroupLabel,
  PopupMenuGroupLabelProps as ContextMenuGroupLabelProps,
  PopupMenuGroupLabelState as ContextMenuGroupLabelState,
  PopupMenuGroupProps as ContextMenuGroupProps,
  PopupMenuGroupState as ContextMenuGroupState,
  PopupMenuHeader as ContextMenuHeader,
  PopupMenuHeaderProps as ContextMenuHeaderProps,
  PopupMenuHeaderState as ContextMenuHeaderState,
  PopupMenuIcon as ContextMenuIcon,
  PopupMenuIconProps as ContextMenuIconProps,
  PopupMenuIconState as ContextMenuIconState,
  PopupMenuInput as ContextMenuInput,
  PopupMenuInputProps as ContextMenuInputProps,
  PopupMenuInputState as ContextMenuInputState,
  PopupMenuItem as ContextMenuItem,
  PopupMenuItemProps as ContextMenuItemProps,
  PopupMenuItemState as ContextMenuItemState,
  PopupMenuList as ContextMenuList,
  PopupMenuListChildrenState as ContextMenuListChildrenState,
  PopupMenuListProps as ContextMenuListProps,
  PopupMenuListState as ContextMenuListState,
  PopupMenuPopup as ContextMenuPopup,
  PopupMenuPopupProps as ContextMenuPopupProps,
  PopupMenuPortal as ContextMenuPortal,
  PopupMenuPortalProps as ContextMenuPortalProps,
  PopupMenuPositioner as ContextMenuPositioner,
  PopupMenuPositionerAlign as ContextMenuPositionerAlign,
  PopupMenuPositionerProps as ContextMenuPositionerProps,
  PopupMenuRadioGroup as ContextMenuRadioGroup,
  PopupMenuRadioGroupProps as ContextMenuRadioGroupProps,
  PopupMenuRadioGroupState as ContextMenuRadioGroupState,
  PopupMenuRadioItem as ContextMenuRadioItem,
  PopupMenuRadioItemIndicator as ContextMenuRadioItemIndicator,
  PopupMenuRadioItemIndicatorProps as ContextMenuRadioItemIndicatorProps,
  PopupMenuRadioItemIndicatorState as ContextMenuRadioItemIndicatorState,
  PopupMenuRadioItemProps as ContextMenuRadioItemProps,
  PopupMenuRadioItemState as ContextMenuRadioItemState,
  PopupMenuScrollArrowProps as ContextMenuScrollArrowProps,
  PopupMenuScrollArrowState as ContextMenuScrollArrowState,
  PopupMenuScrollDownArrowProps as ContextMenuScrollDownArrowProps,
  PopupMenuScrollUpArrowProps as ContextMenuScrollUpArrowProps,
  PopupMenuSeparator as ContextMenuSeparator,
  PopupMenuSeparatorProps as ContextMenuSeparatorProps,
  PopupMenuSeparatorState as ContextMenuSeparatorState,
  PopupMenuShortcut as ContextMenuShortcut,
  PopupMenuShortcutProps as ContextMenuShortcutProps,
  PopupMenuShortcutState as ContextMenuShortcutState,
  PopupMenuSubmenuRoot as ContextMenuSubmenuRoot,
  PopupMenuSubmenuRootProps as ContextMenuSubmenuRootProps,
  PopupMenuSubmenuTrigger as ContextMenuSubmenuTrigger,
  PopupMenuSubmenuTriggerIndicator as ContextMenuSubmenuTriggerIndicator,
  PopupMenuSubmenuTriggerIndicatorProps as ContextMenuSubmenuTriggerIndicatorProps,
  PopupMenuSubmenuTriggerIndicatorState as ContextMenuSubmenuTriggerIndicatorState,
  PopupMenuSubmenuTriggerProps as ContextMenuSubmenuTriggerProps,
  PopupMenuSubmenuTriggerState as ContextMenuSubmenuTriggerState,
  PopupMenuSubpage as ContextMenuSubpage,
  PopupMenuSubpageBack as ContextMenuSubpageBack,
  PopupMenuSubpageBackItem as ContextMenuSubpageBackItem,
  PopupMenuSubpageBackItemProps as ContextMenuSubpageBackItemProps,
  PopupMenuSubpageBackItemState as ContextMenuSubpageBackItemState,
  PopupMenuSubpageBackProps as ContextMenuSubpageBackProps,
  PopupMenuSubpageBackState as ContextMenuSubpageBackState,
  PopupMenuSubpageProps as ContextMenuSubpageProps,
  PopupMenuSubpageTrigger as ContextMenuSubpageTrigger,
  PopupMenuSubpageTriggerProps as ContextMenuSubpageTriggerProps,
  PopupMenuSubpageTriggerState as ContextMenuSubpageTriggerState,
  PopupMenuSurface as ContextMenuSurface,
  PopupMenuSurfaceProps as ContextMenuSurfaceProps,
  PopupMenuSurfaceState as ContextMenuSurfaceState,
} from '../internal/popup-menu/index.js'
// CSS variables (still from popup-menu as they don't have component-specific values)
export {
  PopupMenuListCssVars as ContextMenuListCssVars,
  PopupMenuPositionerCssVars as ContextMenuPositionerCssVars,
} from '../internal/popup-menu/index.js'

// Data attributes with component-specific bazzaui-* selectors
export { ContextMenuArrowDataAttributes } from './arrow/arrow.data-attrs.js'
export { ContextMenuBackdropDataAttributes } from './backdrop/backdrop.data-attrs.js'
export {
  ContextMenuCheckboxItemDataAttributes,
  ContextMenuCheckboxItemIndicatorDataAttributes,
} from './checkbox-item/checkbox-item.data-attrs.js'
export { ContextMenuEmptyDataAttributes } from './empty/empty.data-attrs.js'
export { ContextMenuGroupDataAttributes } from './group/group.data-attrs.js'
export { ContextMenuGroupLabelDataAttributes } from './group-label/group-label.data-attrs.js'
export { ContextMenuIconDataAttributes } from './icon/icon.data-attrs.js'
export { ContextMenuInputDataAttributes } from './input/input.data-attrs.js'
export { ContextMenuItemDataAttributes } from './item/item.data-attrs.js'
export { ContextMenuListDataAttributes } from './list/list.data-attrs.js'
export { ContextMenuPopupDataAttributes } from './popup/popup.data-attrs.js'
export { ContextMenuPositionerDataAttributes } from './positioner/positioner.data-attrs.js'
export { ContextMenuRadioGroupDataAttributes } from './radio-group/radio-group.data-attrs.js'
export {
  ContextMenuRadioItemDataAttributes,
  ContextMenuRadioItemIndicatorDataAttributes,
} from './radio-item/radio-item.data-attrs.js'
export { ContextMenuScrollArrowDataAttributes } from './scroll-arrow/scroll-arrow.data-attrs.js'
export { ContextMenuSeparatorDataAttributes } from './separator/separator.data-attrs.js'
export { ContextMenuShortcutDataAttributes } from './shortcut/shortcut.data-attrs.js'
export {
  ContextMenuSubmenuTriggerDataAttributes,
  ContextMenuSubmenuTriggerIndicatorDataAttributes,
} from './submenu-trigger/submenu-trigger.data-attrs.js'
export { ContextMenuSubpageBackDataAttributes } from './subpage-back/subpage-back.data-attrs.js'
export { ContextMenuSubpageBackItemDataAttributes } from './subpage-back-item/subpage-back-item.data-attrs.js'
export { ContextMenuSubpageTriggerDataAttributes } from './subpage-trigger/subpage-trigger.data-attrs.js'
export { ContextMenuSurfaceDataAttributes } from './surface/surface.data-attrs.js'

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
  FilterFn as ContextMenuFilterFn,
  ItemRegistration as ContextMenuItemRegistration,
  ListboxContext as ContextMenuStoreContext,
  ListboxState as ContextMenuStoreState,
  VirtualItem as ContextMenuVirtualItem,
} from '../internal/listbox/index.js'
export { ListboxStore as ContextMenuStore } from '../internal/listbox/index.js'

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
  // Async coordinator
  AsyncMenuCoordinatorValue,
  AsyncResultBehavior,
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
  NodeDef,
  PopupMenuIdScope,
  PopupMenuNode,
  PopupMenuRadioGroupValueProps as ContextMenuRadioGroupValueProps,
  RadioGroupDef,
  RadioGroupLabelRenderParams,
  RadioGroupRenderParams,
  RadioGroupRenderProps,
  RenderNodeFn,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
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
  isPopupMenuNode,
  isTreeItemDef,
  PopupMenuRadioGroupValue as ContextMenuRadioGroupValue,
  useAsyncMenuCoordinator,
  useDataList,
  useDataSurfaceContext,
  useMaybeAsyncMenuCoordinator,
  useMaybeDataList,
  useMaybeDataSurfaceContext,
} from '../internal/popup-menu/index.js'
