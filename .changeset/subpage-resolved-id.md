---
'@bazza-ui/react': minor
---

**Breaking change.** Data-first subpages are now addressed by the branch's Resolved ID: `SubpageContentRenderParams.pageId` equals `node.id`, and `SubpageDef.pageId` is removed (use `id` to author a stable Resolved ID). The root surface is no longer a page — `activePageId` is `null` at root and the `"__root__"` sentinel is gone, so any string is a valid page ID. Registering the same page ID twice in one popup now warns in development; the first registration wins. Imperative `<Subpage pageId>` is unchanged.
