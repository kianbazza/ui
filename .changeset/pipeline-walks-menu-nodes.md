---
'@bazza-ui/react': minor
---

**Breaking change.** The data-first display pipeline now walks Menu Nodes: `ScoredNode.node` is a `PopupMenuNode` (read authored fields via `node.def`), and `BreadcrumbNode` gains `menuNode` (its `node`, `value`, and `id` are unchanged). Passing a raw def anywhere the engine expects a Menu Node is no longer possible; the internal `resolveDetachedNode` helper is removed.
