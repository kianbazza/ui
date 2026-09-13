// ============================================================================
// Data-First Utilities
// ============================================================================

export type { AsyncSubmenuInfo } from './async.js'
export {
  collectAsyncSubmenus,
  shouldIncludeInDeepSearch,
  shouldIncludeSubmenuRowsInDeepSearch,
  shouldLoadEagerly,
} from './async.js'
export { getBrowseNodesFlatten, getBrowseNodesPreserve } from './browse.js'
export { resolveDetachedNodeForDef } from './detached.js'
export { buildDisplayRowNodes } from './display.js'
export { flattenNodes, getSupportedTreeChildren } from './flatten.js'
export {
  computeDefPath,
  getAsyncLoaderIdForBranch,
  getSubpagePageId,
} from './path-ids.js'
export type { FilterNodesOptions } from './pipeline.js'
export { filterNodes } from './pipeline.js'
export { scoreNodes } from './score.js'
export { deduplicateNodes, partitionByKind, sortByScore } from './sort.js'
export {
  isCheckboxItemDef,
  isGroupDef,
  isItemDef,
  isRadioGroupDef,
  isRadioItemDef,
  isSeparatorDef,
  isSubmenuDef,
  isSubpageDef,
  isTreeItemDef,
} from './type-guards.js'
