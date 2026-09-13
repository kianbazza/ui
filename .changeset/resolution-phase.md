---
'@bazza-ui/react': minor
---

**Breaking change (internal contract).** The popup-menu data-first list resolves static `content` synchronously during render and grafts loader results under their branch Menu Node from effects, via a dedicated resolution phase. Menu Nodes always reference the authored def (`node.def`); loader results appear only as children. Sibling subpage collection walks Menu Nodes. Anyone importing `DataPopupContextValue.resolvedContent` or `mergeAsyncNodesIntoTree` from the internal barrel must switch to `resolvedNodes` / `defsOf`. `ScoredNode` and `BreadcrumbNode` are unchanged in this release.
