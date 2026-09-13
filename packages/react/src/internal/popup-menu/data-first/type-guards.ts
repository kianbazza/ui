// ============================================================================
// Type Guards
// ============================================================================

import type {
  CheckboxItemDef,
  GroupDef,
  ItemDef,
  NodeDef,
  RadioGroupDef,
  RadioItemDef,
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
