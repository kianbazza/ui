---
'@bazza-ui/react': minor
---

**Breaking change.** Rename popup-menu identity vocabulary and the custom resolution seam:

- `getRowId` → `getResolvedId` on `DropdownMenu.Root`, `ContextMenu.Root`, and `CommandMenu.Root`.
- `GetRowIdFn` → `GetResolvedIdFn`.
- `UnidentifiedMenuNode` → `UnresolvedMenuNode`.
- `PopupMenuNode.pathSegment` → `definitionKey`.
- `PopupMenuNode.defPath` → `definitionPath`.
- `defaultGetRowId` → `defaultGetResolvedId`.
- `segmentForDef` → `definitionKeyForDef`.
- `contributesPathSegment` → `contributesDefinitionPath`.

Update custom callbacks and property reads to use the new names. Resolved IDs retain the current default behavior: explicit `def.id`, otherwise the dot-joined `definitionPath`.

Direct migration:

- `UsePopupMenuRootParams.getRowId` → `UsePopupMenuRootParams.getResolvedId`.
- `MenuTreeResolver.getRowId` → `MenuTreeResolver.getResolvedId`.
