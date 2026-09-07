// ============================================================================
// Type Guards
// ============================================================================

import type { PopupMenuNode } from '../menu-tree/types.js'
import type {
  CheckboxItemDef,
  GroupDef,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
  RowNodeDef,
  SubmenuDef,
  SubpageDef,
  TreeItemDef,
} from './types.js'

// ============================================================================
// Type Guards
// ============================================================================

export function isItemDef(node: NodeDef): node is ItemDef {
  return node.kind === 'item'
}

export function isRadioItemDef(node: NodeDef): node is RadioItemDef {
  return node.kind === 'radio-item'
}

export function isCheckboxItemDef(node: NodeDef): node is CheckboxItemDef {
  return node.kind === 'checkbox-item'
}

export function isTreeItemDef(node: NodeDef): node is TreeItemDef {
  return node.kind === 'tree-item'
}

export function isSubmenuDef(node: NodeDef): node is SubmenuDef {
  return node.kind === 'submenu'
}

export function isSubpageDef(node: NodeDef): node is SubpageDef {
  return node.kind === 'subpage'
}

export function isGroupDef(node: NodeDef): node is GroupDef {
  return node.kind === 'group'
}

export function isRadioGroupDef(node: NodeDef): node is RadioGroupDef {
  return node.kind === 'radio-group'
}

export function isSeparatorDef(
  node: NodeDef,
): node is { kind: 'separator'; id: string } {
  return node.kind === 'separator'
}

// ============================================================================

// ============================================================================
// Menu Node Guards
// ============================================================================
//
// `PopupMenuNode<NodeDef>.kind` mirrors `def.kind` but does not narrow `def`;
// these guards narrow the whole node by its authored def.

export function isMenuNodeOfKind<K extends NodeDef['kind']>(
  node: PopupMenuNode,
  kind: K,
): node is PopupMenuNode<Extract<NodeDef, { kind: K }>> {
  return node.def.kind === kind
}

export function isRowMenuNode(
  node: PopupMenuNode,
): node is PopupMenuNode<RowNodeDef> {
  const kind = node.def.kind
  return (
    kind === 'item' ||
    kind === 'radio-item' ||
    kind === 'checkbox-item' ||
    kind === 'submenu' ||
    kind === 'subpage' ||
    kind === 'tree-item'
  )
}

export function isBranchMenuNode(
  node: PopupMenuNode,
): node is PopupMenuNode<SubmenuDef | SubpageDef> {
  return node.def.kind === 'submenu' || node.def.kind === 'subpage'
}
