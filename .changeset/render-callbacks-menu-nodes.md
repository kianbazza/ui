---
'@bazza-ui/react': minor
---

**Breaking change.** Data-first submenu and subpage render callbacks now receive resolved Menu Nodes: `nodes` is `PopupMenuNode[]` and `renderNode` accepts a `PopupMenuNode` only. Read authored fields via `child.def` (`child.value` → `child.def.value`). Passing a raw node def to `renderNode` is no longer supported; `DataSurface.content` still accepts either defs or Menu Nodes.
