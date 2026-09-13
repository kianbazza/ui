---
'@bazza-ui/react': minor
---

**Breaking change.** Data-first async loaders are now keyed by the branch's Resolved ID, so two branches with the same `value` but different `id`s load independently; the root surface's `asyncContent` loader is exposed as `coordinator.root` instead of a `"__root__"` entry in `loaders`. `AsyncState.skippedMenus` entries are now `{ kind: 'root' } | { kind: 'branch', id }`. Deep-search deduplication keys on Resolved ID, so a custom `getResolvedId` that distinguishes same-value rows keeps both.
