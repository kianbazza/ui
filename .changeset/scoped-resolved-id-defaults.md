---
'@bazza-ui/react': minor
---

Popup-menu data-first roots now default to surface-scoped Resolved IDs, using encoded Definition Paths. Roots accept `idScope="menu"` for Definition Key IDs and menu-wide Definition Key validation; `idScope` does not restore old IDs. Consumers needing the old dot-path default should provide `node => node.def.id ?? node.definitionPath.join('.')` at mount time. This common migration does not recreate former tree-item ancestry; exact compatibility for that case requires walking `node.parent` and reproducing the old slug/key lineage. Separator definitions must provide an ID, and tree-item ancestry is transparent to Definition Paths. The `idScope` and `getResolvedId` policy is read once for each root.
