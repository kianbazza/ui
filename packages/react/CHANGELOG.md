# @bazza-ui/react

## 0.1.0-canary.10

### Minor Changes

- [#478](https://github.com/bazzalabs/ui/pull/478) [`cf4eb2b`](https://github.com/bazzalabs/ui/commit/cf4eb2b8d729afcf3f02225e03df4ce1b8692b72) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** Data-first async loaders are now keyed by the branch's Resolved ID, so two branches with the same `value` but different `id`s load independently; the root surface's `asyncContent` loader is exposed as `coordinator.root` instead of a `"__root__"` entry in `loaders`. `AsyncState.skippedMenus` entries are now `{ kind: 'root' } | { kind: 'branch', id }`. Deep-search deduplication keys on Resolved ID, so a custom `getResolvedId` that distinguishes same-value rows keeps both.

- [#431](https://github.com/bazzalabs/ui/pull/431) [`43169af`](https://github.com/bazzalabs/ui/commit/43169afb312f3b0b4fee588e0caaf482654c59c4) Thanks [@kianbazza](https://github.com/kianbazza)! - Add the `value` prop to the menu `CheckboxItem` part. Like `Item`, it sets the unique value used for search filtering; when omitted, the value is inferred from textContent as before.

- [#453](https://github.com/bazzalabs/ui/pull/453) [`8625605`](https://github.com/bazzalabs/ui/commit/86256057a28f4a027bcf5b7929c65d3c564952d3) Thanks [@kianbazza](https://github.com/kianbazza)! - Display group, radio-group, and separator nodes now carry their resolved menu node as `node`, with authored facts available at `node.def` and canonical identity at `node.id`. The old `group`, `radioGroup`, `separator`, and `resolvedNode` fields have been removed.

- [#452](https://github.com/bazzalabs/ui/pull/452) [`4bdb5e4`](https://github.com/bazzalabs/ui/commit/4bdb5e460c34940ca28373e25887d812984fbb7a) Thanks [@kianbazza](https://github.com/kianbazza)! - Display rows now expose a resolved `PopupMenuNode` on `node`, including its canonical `id` and authored definition at `node.def`. Rows have a `kind: 'row'` discriminant, and `compositeId` is removed in favor of `node.id`.

- [#454](https://github.com/bazzalabs/ui/pull/454) [`dff28b8`](https://github.com/bazzalabs/ui/commit/dff28b8952298afb741badc8c5ad87be78db1501) Thanks [@kianbazza](https://github.com/kianbazza)! - `DisplaySubpageNode.node` is now the resolved `PopupMenuNode`, with the authored definition available at `node.def`.

- [#445](https://github.com/bazzalabs/ui/pull/445) [`94e6d35`](https://github.com/bazzalabs/ui/commit/94e6d3551489b82ccbcf7e736e1a947ab21dfb01) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `DropdownMenu.Node`/`DropdownMenu.NodeDef` (and ContextMenu/CommandMenu equivalents) as pure aliases of the canonical resolved-node types. `Surface` `content` now accepts resolved nodes (`Node[]`) as well as defs.

- [#410](https://github.com/bazzalabs/ui/pull/410) [`f0665b3`](https://github.com/bazzalabs/ui/commit/f0665b3c7a315fbcbac5b40e0f6f91d5e6aa8e0e) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `data-first` and `data-last` attributes to the menu `GroupLabel` part, marking a label that is the first or last row in the list. `data-first` resolves from `GroupValue` `positional.first` with a fallback to the store's row order, so it stays correct in virtualized lists where DOM order doesn't match list order. `data-last` comes only from `positional.last`, since the store can only report whether the _group_ is the last row and a label is always followed by its own items.

- [#393](https://github.com/bazzalabs/ui/pull/393) [`faae4e4`](https://github.com/bazzalabs/ui/commit/faae4e42ec64e0511bc2ec9111e73fd99fe3361b) Thanks [@kianbazza](https://github.com/kianbazza)! - Add headless `GroupValue` provider (dropdown-menu, context-menu) and allow group/positional context to override store-derived positional data attributes — enables correct `data-first-in-group`-family attributes on rows in virtualized lists.

- [#444](https://github.com/bazzalabs/ui/pull/444) [`4f1e6b9`](https://github.com/bazzalabs/ui/commit/4f1e6b9e6575a158d4ab388f16596c041c13b04b) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** `onHighlightChange` on `DropdownMenu.Root`, `ContextMenu.Root`, and `Submenu` is now `(id, node, index, eventDetails)` — `id` remains first for both JSX and data-first rows, while `node` is second as nullable enrichment. `node` is the resolved menu node carrying the highlighted id, looked up in the menu's data-first tree (`null` when the highlight clears or when no data-first node carries that id — e.g. JSX-defined rows; a JSX row that deliberately shares an id with a data-first node yields that node). `Select`/`Combobox` signatures are unchanged. Migration: `(id, index) => …` → `(id, node, index) => …`.

- [#466](https://github.com/bazzalabs/ui/pull/466) [`e874f33`](https://github.com/bazzalabs/ui/commit/e874f33de2587ba199bb88a046a64393265a302e) Thanks [@kianbazza](https://github.com/kianbazza)! - Rename the `@bazza-ui/react/adapters` subpath to `@bazza-ui/react/loaders`. The optional `QueryDependentLoaderConfig` type is now `QueryLoaderConfig`; update imports accordingly.

- [#449](https://github.com/bazzalabs/ui/pull/449) [`266514f`](https://github.com/bazzalabs/ui/commit/266514f31b9cc362551053ea036c106eb0e4a1c0) Thanks [@kianbazza](https://github.com/kianbazza)! - Breaking change for direct consumers of the `@bazza-ui/react/internal/popup-menu` subpath: the barrel now exports only the surface consumed by the public menu families plus the resolved-node model (`PopupMenuNode`, `MenuTreeResolver`, `GetRowIdFn`, `defaultGetRowId`, `isPopupMenuNode`, …) and the deprecated navigation helpers. Roughly 110 previously re-exported symbols are gone — including most raw context objects and provider internals, un-prefixed data-attribute maps superseded by family-prefixed re-exports, deep-search scoring/traversal internals, aim-guard/mouse-trail/debug plumbing, tree and subpage internals, and several hook parameter/return types. If you imported one of these from the internal subpath, import the equivalent from the public family entries (`@bazza-ui/react/dropdown-menu`, …) instead, or treat it as internal.

- [#450](https://github.com/bazzalabs/ui/pull/450) [`41e911f`](https://github.com/bazzalabs/ui/commit/41e911f5586c7834d6afaa7bfed76fe1313d5d56) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** `PopupMenuNode.segment` is now `PopupMenuNode.pathSegment`, a node's own component of its definition path; it equals the row id only when the def carries an explicit `id`. Custom `getRowId` implementations reading `node.segment` must update.

  The internal directory rename (`resolve/` → `menu-tree/`) is not public surface — the `@bazza-ui/react/internal/popup-menu` barrel exports the same symbol names from the same subpath.

- [#475](https://github.com/bazzalabs/ui/pull/475) [`d4c39bd`](https://github.com/bazzalabs/ui/commit/d4c39bd58ccbb76a19fe715436be8c9fde445921) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** The data-first display pipeline now walks Menu Nodes: `ScoredNode.node` is a `PopupMenuNode` (read authored fields via `node.def`), and `BreadcrumbNode` gains `menuNode` (its `node`, `value`, and `id` are unchanged). Passing a raw def anywhere the engine expects a Menu Node is no longer possible; the internal `resolveDetachedNode` helper is removed.

- [#414](https://github.com/bazzalabs/ui/pull/414) [`4a92bd4`](https://github.com/bazzalabs/ui/commit/4a92bd44572881de14841c85525d053f2963b398) Thanks [@kianbazza](https://github.com/kianbazza)! - Dropdown-menu and context-menu now close the whole menu tree explicitly when Tab or Shift+Tab is pressed inside an open menu, instead of relying on emergent focus-out behavior.

- [#416](https://github.com/bazzalabs/ui/pull/416) [`f13dc55`](https://github.com/bazzalabs/ui/commit/f13dc55ef2ee059651a0e71a7f6969bad1031d70) Thanks [@kianbazza](https://github.com/kianbazza)! - Add the `FocusZone` part to dropdown-menu and context-menu. Wrapping tabbable content (footers, toolbars, forms) in `FocusZone` makes Tab/Shift+Tab cycle focus within the menu surface (input → list → zone content → wrap) instead of closing the menu. Menus without zones keep the explicit Tab-close behavior.

- [#377](https://github.com/bazzalabs/ui/pull/377) [`7065957`](https://github.com/bazzalabs/ui/commit/706595787d948c3644eb8b2483c9b4ef856e0fb2) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `data-first-group` and `data-last-group` attributes to menu `Group`, `RadioGroup`, and `GroupLabel` parts. They mark the first/last visible group in a list and update with filtering.

- [#418](https://github.com/bazzalabs/ui/pull/418) [`d38f2d3`](https://github.com/bazzalabs/ui/commit/d38f2d32a850258a2d65eef031807489453faa25) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `Header` and `Footer` parts to dropdown-menu and context-menu — structural containers whose tabbable children join the menu's Tab cycle.

- [#451](https://github.com/bazzalabs/ui/pull/451) [`8174b97`](https://github.com/bazzalabs/ui/commit/8174b97965e09d18f2c9a0d4cc2bb02c4964b7ec) Thanks [@kianbazza](https://github.com/kianbazza)! - `PopupMenuNode` is now generic over its originating def, and the deprecated navigable-id helpers have been removed.

- [#379](https://github.com/bazzalabs/ui/pull/379) [`daded20`](https://github.com/bazzalabs/ui/commit/daded209f1004fbf947b344a8ee1394d54b0d2b2) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `data-first`/`data-last` (first/last visible list-level row) and `data-first-in-group`/`data-last-in-group` (first/last visible row within a group) attributes to menu items, checkbox/radio items, submenu/subpage triggers, select/combobox items, groups, separators, empty, and loading parts. Attributes are filter-aware and disabled in virtualized mode.

- [#417](https://github.com/bazzalabs/ui/pull/417) [`064e1f6`](https://github.com/bazzalabs/ui/commit/064e1f61a22e13f592d4836d8de76224f68b8fa7) Thanks [@kianbazza](https://github.com/kianbazza)! - Tab pressed in a zone-less submenu now closes the submenu chain and moves focus into the nearest ancestor surface's focus zone, instead of closing the entire menu.

- [#441](https://github.com/bazzalabs/ui/pull/441) [`17ddf49`](https://github.com/bazzalabs/ui/commit/17ddf494c29cacd555d18dc74966e93b859cba79) Thanks [@kianbazza](https://github.com/kianbazza)! - Add the `getRowId` prop to `DropdownMenu.Root`, `ContextMenu.Root`, and `CommandMenu.Root`. It receives the unidentified resolved node (definitional facts only); by default, explicit `id` is used verbatim, otherwise the definition path is used.

  Export the `PopupMenuNode`, `GetRowIdFn`, and `UnidentifiedMenuNode` types, and deprecate `getNavigableIds` in favor of resolver nodes or `getOrderedItemIds`.

  The new prop supersedes `getQualifiedRowId` and `rowIdStrategy`, which are removed by the accompanying identity swap in this same release.

- [#434](https://github.com/bazzalabs/ui/pull/434) [`cd25163`](https://github.com/bazzalabs/ui/commit/cd2516376e6c48428347b350b060dbefe269c7f9) Thanks [@kianbazza](https://github.com/kianbazza)! - **Behavior change:** data-first row ids now default to the `'qualified'` strategy. Rows without an explicit `id` are identified by their full path in the menu definition — ancestor branch segments (submenus and tree items) plus their slugified value — in both browse and deep-search contexts (previously the path was included only during deep search, so the same row had two different ids). Rows with an explicit `id` are unaffected. Set `rowIdStrategy="hybrid"` on `Root` or the data `Surface` to restore the legacy behavior.

- [#460](https://github.com/bazzalabs/ui/pull/460) [`83cd82d`](https://github.com/bazzalabs/ui/commit/83cd82d4401140dd7b2c749b25755383c85670b0) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** Rename popup-menu identity vocabulary and the custom resolution seam:

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

- [#476](https://github.com/bazzalabs/ui/pull/476) [`65d1e98`](https://github.com/bazzalabs/ui/commit/65d1e98b52e31a589097a375e741da821f0a1ca5) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** Data-first submenu and subpage render callbacks now receive resolved Menu Nodes: `nodes` is `PopupMenuNode[]` and `renderNode` accepts a `PopupMenuNode` only. Read authored fields via `child.def` (`child.value` → `child.def.value`). Passing a raw node def to `renderNode` is no longer supported; `DataSurface.content` still accepts either defs or Menu Nodes.

- [#394](https://github.com/bazzalabs/ui/pull/394) [`2727a24`](https://github.com/bazzalabs/ui/commit/2727a242c64fc533503c38befab377b20ebc6adb) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `renderLabel` to group and radio-group defs, and render a visible default label in data-API group/radio-group rendering when `label` is set (previously aria-only unless a container `render` was provided).

- [#443](https://github.com/bazzalabs/ui/pull/443) [`7265710`](https://github.com/bazzalabs/ui/commit/72657106c9ccca22ea72ab3f620bfccbfbaf8282) Thanks [@kianbazza](https://github.com/kianbazza)! - Data-first render callbacks now receive the resolved `node` (`PopupMenuNode`) with its canonical `id`, `defPath`, and `parent`/`children` links. `renderNode` accepts resolved nodes or defs. Existing `{ props, context }` destructuring keeps working.

- [#474](https://github.com/bazzalabs/ui/pull/474) [`5fc8a47`](https://github.com/bazzalabs/ui/commit/5fc8a471357afe702f5d5f888d8bd9e0aefecc1e) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change (internal contract).** The popup-menu data-first list resolves static `content` synchronously during render and grafts loader results under their branch Menu Node from effects, via a dedicated resolution phase. Menu Nodes always reference the authored def (`node.def`); loader results appear only as children. Sibling subpage collection walks Menu Nodes. Anyone importing `DataPopupContextValue.resolvedContent` or `mergeAsyncNodesIntoTree` from the internal barrel must switch to `resolvedNodes` / `defsOf`. `ScoredNode` and `BreadcrumbNode` are unchanged in this release.

- [#442](https://github.com/bazzalabs/ui/pull/442) [`ba5639e`](https://github.com/bazzalabs/ui/commit/ba5639ea3cc06d3c5857826236cd62833058ea41) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** Data-first row ids are now the canonical resolved ids (`getRowId`: explicit `id` verbatim, else the definition path). `getQualifiedRowId`, `rowIdStrategy`, and `GetQualifiedRowIdContext` are removed — use the `getRowId` prop on `Root`. The `hybrid` strategy has no successor: ids no longer depend on render context by construction.

  Two id changes for un-customized menus: rows under a **subpage** now include the subpage's segment in their definition path; a **single def object reused under two parents** now resolves to one node (first occurrence). Persisted state keyed by old ids must migrate.

- [#433](https://github.com/bazzalabs/ui/pull/433) [`0e4541f`](https://github.com/bazzalabs/ui/commit/0e4541f02eb569502fddbc91aa9694f5f1b4a8e9) Thanks [@kianbazza](https://github.com/kianbazza)! - Add the `rowIdStrategy` prop (`'qualified' | 'explicit' | 'hybrid'`) to `DropdownMenu.Root`, `ContextMenu.Root`, and data surfaces for choosing how data-first row ids are computed. `'qualified'` produces context-independent ids; `'hybrid'` (the current default) is unchanged legacy behavior. A `getQualifiedRowId` function still takes precedence, and now also applies to rows rendered through submenu `renderNode` recursion (previously those rows fell back to raw `node.id ?? node.value` regardless of configuration).

- [#461](https://github.com/bazzalabs/ui/pull/461) [`76f18e8`](https://github.com/bazzalabs/ui/commit/76f18e83cbf4223bd985b37d894a625327921812) Thanks [@kianbazza](https://github.com/kianbazza)! - Popup-menu data-first roots now default to surface-scoped Resolved IDs, using encoded Definition Paths. Roots accept `idScope="menu"` for Definition Key IDs and menu-wide Definition Key validation; `idScope` does not restore old IDs. Consumers needing the old dot-path default should provide `node => node.def.id ?? node.definitionPath.join('.')` at mount time. This common migration does not recreate former tree-item ancestry; exact compatibility for that case requires walking `node.parent` and reproducing the old slug/key lineage. Separator definitions must provide an ID, and tree-item ancestry is transparent to Definition Paths. The `idScope` and `getResolvedId` policy is read once for each root.

- [#468](https://github.com/bazzalabs/ui/pull/468) [`07e12ec`](https://github.com/bazzalabs/ui/commit/07e12ecf3ee7cc9d530d232b65bfaed102ecd6d3) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `closeOnPointerLeave` prop to `SubmenuTrigger` (DropdownMenu / ContextMenu) to keep a submenu open when the pointer leaves its trigger.

- [#448](https://github.com/bazzalabs/ui/pull/448) [`75766c3`](https://github.com/bazzalabs/ui/commit/75766c3cdd607c54ad807556b8ecef01e3022e6e) Thanks [@kianbazza](https://github.com/kianbazza)! - **Behavior change.** Subpage page ids now follow the canonical segment rule — explicit `id`s pass through verbatim instead of being slugified (`subpage.My.Page` where the id is `"My.Page"`; previously `subpage.mypage`). Ids without explicit `id`, and explicit `pageId` props, are unaffected. Update any hardcoded `targetPageId`/`pageId` strings that relied on slugified explicit ids.

- [#477](https://github.com/bazzalabs/ui/pull/477) [`a7302f3`](https://github.com/bazzalabs/ui/commit/a7302f3e411b3002fa93d048010ea2b35bd00a68) Thanks [@kianbazza](https://github.com/kianbazza)! - **Breaking change.** Data-first subpages are now addressed by the branch's Resolved ID: `SubpageContentRenderParams.pageId` equals `node.id`, and `SubpageDef.pageId` is removed (use `id` to author a stable Resolved ID). The root surface is no longer a page — `activePageId` is `null` at root and the `"__root__"` sentinel is gone, so any string is a valid page ID. Registering the same page ID twice in one popup now warns in development; the first registration wins. Imperative `<Subpage pageId>` is unchanged.

### Patch Changes

- [#428](https://github.com/bazzalabs/ui/pull/428) [`868ed5f`](https://github.com/bazzalabs/ui/commit/868ed5f2e27ea324831c30cc99ad76569949ac90) Thanks [@kianbazza](https://github.com/kianbazza)! - The command menu now handles Tab explicitly: with tabbable header/footer content, Tab cycles Input → zone controls → Input; with none, Tab is a no-op instead of closing the palette. Initial open focus now always lands on the surface input even when a dialog focus manager pre-focuses a header control.

- [#427](https://github.com/bazzalabs/ui/pull/427) [`1d5451a`](https://github.com/bazzalabs/ui/commit/1d5451a05f645ccc34181e4e6049ee527f76bd77) Thanks [@kianbazza](https://github.com/kianbazza)! - `CommandMenu.Header` is now the shared popup-menu header part, and `CommandMenu.Footer` and `CommandMenu.FocusZone` are exported alongside it. The header's attribute changes from `data-command-menu-header` to the slot attribute `bazzaui-command-menu-header`.

- [#471](https://github.com/bazzalabs/ui/pull/471) [`8951644`](https://github.com/bazzalabs/ui/commit/89516447fa599038fdf9bb4ec2b9bf7ca220182b) Thanks [@kianbazza](https://github.com/kianbazza)! - Internal: the data-first popup-menu pipeline moved from `internal/popup-menu/deep-search/` to `internal/popup-menu/data-first/` and its utilities were split into per-section modules. No public API changes.

- [#432](https://github.com/bazzalabs/ui/pull/432) [`3320a68`](https://github.com/bazzalabs/ui/commit/3320a68da17b73a99549cd848749c126d1638d70) Thanks [@kianbazza](https://github.com/kianbazza)! - Thread the display path (the enclosing submenu chain of the surface a row is rendered in) across data-first surfaces, and expose two new optional fields on `GetQualifiedRowIdContext`: `displayPath` (contextual — where the row is displayed this render) and `defPath` (canonical — the row's full path in the definition tree, identical in browse and deep search). No behavior change; groundwork for stable row-id strategies.

- [#435](https://github.com/bazzalabs/ui/pull/435) [`08cc123`](https://github.com/bazzalabs/ui/commit/08cc123f2e9868e68268e39c39a417ee4b86c986) Thanks [@kianbazza](https://github.com/kianbazza)! - Warn in development when two data-first rows compute the same row id, within one surface or across surfaces of the same menu. Duplicate ids silently share highlight and keyboard-navigation identity; the warning names the offending id. No production impact.

- [#413](https://github.com/bazzalabs/ui/pull/413) [`fef3d31`](https://github.com/bazzalabs/ui/commit/fef3d31c465a854baab336269b8a00b5f5f79433) Thanks [@kianbazza](https://github.com/kianbazza)! - Default `clearSearchOnClose` to `'after-exit'` for ContextMenu, DropdownMenu, and Select surfaces so the search query clears after the exit animation instead of flashing the unfiltered list mid-close. Combobox keeps its previous default (`true`).

- [#438](https://github.com/bazzalabs/ui/pull/438) [`95842de`](https://github.com/bazzalabs/ui/commit/95842de41bd089e47bad8852e7fc7ef51e7c1b4e) Thanks [@kianbazza](https://github.com/kianbazza)! - Add an internal root-owned menu-tree resolver for data-first popup menus: node defs are resolved once per menu root into stable node instances, reconciled by id with a reference fast path, and late defs are grafted with correct lineage. Internal groundwork only — no public API or behavior change.

- [#415](https://github.com/bazzalabs/ui/pull/415) [`864d06f`](https://github.com/bazzalabs/ui/commit/864d06f220fe06b4a76ad88fc7952a72061ec227) Thanks [@kianbazza](https://github.com/kianbazza)! - Focus ownership in dropdown-menu and context-menu now follows real DOM focus: focusing an element inside a menu surface makes that surface the focus owner, and auto-focus no longer steals focus that is already inside the surface.

- [#473](https://github.com/bazzalabs/ui/pull/473) [`fb825c9`](https://github.com/bazzalabs/ui/commit/fb825c9712004307c04ed3ad2a0c727d72ee4b6b) Thanks [@kianbazza](https://github.com/kianbazza)! - The popup-menu Menu Tree resolver now returns the existing node array from `setContent`/`graft` when re-supplied defs produce no change, so `rootNodes` and `parent.children` keep their identity across unchanged re-renders.

- [#440](https://github.com/bazzalabs/ui/pull/440) [`76543bd`](https://github.com/bazzalabs/ui/commit/76543bd1d9b279be9d214f9c026aaf51270cd8f4) Thanks [@kianbazza](https://github.com/kianbazza)! - Duplicate row-id detection for data-first menus now runs at resolution time, in one place, covering the entire menu definition — including rows rendered through submenu `renderNode` recursion and branches that are not currently open, which the previous per-surface checks missed. The dev-only warning text changed accordingly. Detection now keys off the canonical resolved ids (explicit `id`, else the definition path); composite ids computed by a custom `getQualifiedRowId` or a non-default `rowIdStrategy` are no longer themselves inspected — collisions that exist only in those computed strings are not flagged, while canonical collisions are flagged regardless of strategy. Those APIs are superseded in the next breaking release.

- [#378](https://github.com/bazzalabs/ui/pull/378) [`cafe573`](https://github.com/bazzalabs/ui/commit/cafe573cc9f800bcb5d8637753d212842139d482) Thanks [@kianbazza](https://github.com/kianbazza)! - Keyboard navigation in `DropdownMenu`, `ContextMenu`, `Select`, and `Combobox` now reveals a group's label when the highlight lands on the group's first item, instead of aligning the scroll viewport to the item and leaving the label clipped above it.

## 0.1.0-canary.9

### Patch Changes

- [#358](https://github.com/bazzalabs/ui/pull/358) [`17040ad`](https://github.com/bazzalabs/ui/commit/17040adffb543fbf0b7f0fe85fa69093d646a051) Thanks [@kianbazza](https://github.com/kianbazza)! - `Select` now closes on trigger press-down (`pointerdown`) instead of waiting for a full click, matching `DropdownMenu`. `Select.Root` also accepts a `closeOnOutsidePress` prop (`'pointerdown'` default, or `'click'`) for parity with the other menu roots.

## 0.1.0-canary.8

### Patch Changes

- [#341](https://github.com/bazzalabs/ui/pull/341) [`e6dc2f0`](https://github.com/bazzalabs/ui/commit/e6dc2f0b9904e36d1994f8bccacc655f5476eff2) Thanks [@kianbazza](https://github.com/kianbazza)! - `Combobox.Clear` now forwards a consumer-provided `onPointerDown` handler instead of silently dropping it, while still preventing the button from stealing focus from the input.

- [#342](https://github.com/bazzalabs/ui/pull/342) [`856f7c6`](https://github.com/bazzalabs/ui/commit/856f7c634f24546478ac785ef086e99ab006e2ac) Thanks [@kianbazza](https://github.com/kianbazza)! - Pressing the popup-menu search input now always focuses it: surfaces no longer cancel pointerdown on inputs, and the input claims focus ownership for its surface on pointerdown.

- [#354](https://github.com/bazzalabs/ui/pull/354) [`9aff1da`](https://github.com/bazzalabs/ui/commit/9aff1daf160637fe0850bf48d8d61efc4a4a4629) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix submenus not reopening when the pointer re-enters the trigger after a hover-off close

- [#339](https://github.com/bazzalabs/ui/pull/339) [`d44a0e3`](https://github.com/bazzalabs/ui/commit/d44a0e3997c0d06081b379156fac19827046d43b) Thanks [@kianbazza](https://github.com/kianbazza)! - Consumer event handlers on `DropdownMenu.Trigger` and `Select.Trigger` now chain with internal handlers instead of replacing them. Opt out of the internal behavior with `event.preventBaseUIHandler()`.

## 0.1.0-canary.7

### Patch Changes

- [#308](https://github.com/bazzalabs/ui/pull/308) [`2cb28b7`](https://github.com/bazzalabs/ui/commit/2cb28b7cdd03a073f6af6092977de39c223ffb96) Thanks [@kianbazza](https://github.com/kianbazza)! - Bump `@base-ui/react` to `1.5.0` and `@base-ui/utils` to `0.2.9`.

- [#317](https://github.com/bazzalabs/ui/pull/317) [`1bc682c`](https://github.com/bazzalabs/ui/commit/1bc682c621202e0568271673191705fc8da44185) Thanks [@kianbazza](https://github.com/kianbazza)! - Assert expected ListboxStore warnings in tests to keep test output clean.

- [#320](https://github.com/bazzalabs/ui/pull/320) [`10cb2e3`](https://github.com/bazzalabs/ui/commit/10cb2e384fd658c8c2a8f03d1d4c9d7b65485655) Thanks [@kianbazza](https://github.com/kianbazza)! - Preserve dropdown menu row highlights until exit animations finish.

- [#329](https://github.com/bazzalabs/ui/pull/329) [`967a2cf`](https://github.com/bazzalabs/ui/commit/967a2cf1984b9ee4b985edf17c89dcea160417b0) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix `Select.Value` treating falsy-but-valid values (`0`, `false`, `''`) as empty and showing the placeholder. Select now uses a shared `isValueEmpty` helper so `Select.Value`, `Select.Trigger`, and `Select.Surface` agree on what counts as an empty selection, matching `Combobox`.

- [#319](https://github.com/bazzalabs/ui/pull/319) [`6f81c20`](https://github.com/bazzalabs/ui/commit/6f81c20bb2fbafef1ae67203204b51faa285a3d6) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix select popup positioning when aligning items with the trigger after the Base UI v1.5 positioning change.

- [#332](https://github.com/bazzalabs/ui/pull/332) [`a7fd8ae`](https://github.com/bazzalabs/ui/commit/a7fd8aeacab87124c398c2dd447a9ec13406d29e) Thanks [@kianbazza](https://github.com/kianbazza)! - Filtering is now diacritics-insensitive by default across all listbox-based components (Select, Combobox, menus). Unaccented queries match accented content and vice versa (e.g. `cafe` matches `café`, `sao` matches `São Paulo`). To opt out, pass a custom `filter`/`normalizeSearch` on `Select.Surface`.

- [#306](https://github.com/bazzalabs/ui/pull/306) [`8bf663d`](https://github.com/bazzalabs/ui/commit/8bf663db9b4d0542e21ab2ebf97bb776678d8eb0) Thanks [@kianbazza](https://github.com/kianbazza)! - Replace `DataList` children-as-function render prop with normal children and a
  `useDataList()` hook. List content now lives in child components that call
  `useDataList()`. This is a breaking change to the `DataList` API.

- [#304](https://github.com/bazzalabs/ui/pull/304) [`ba94100`](https://github.com/bazzalabs/ui/commit/ba94100ba468d7fe263ab9d9be1ed44dba7b7ca6) Thanks [@kianbazza](https://github.com/kianbazza)! - Add popup menu `resetScrollOnSearch` support and allow lists to provide a custom scroll container ref.

- [#303](https://github.com/bazzalabs/ui/pull/303) [`dab197d`](https://github.com/bazzalabs/ui/commit/dab197df8c390eee866d981723cf087578d0979c) Thanks [@kianbazza](https://github.com/kianbazza)! - Reset non-virtualized popup menu list scroll positions when the search query changes.

- [#326](https://github.com/bazzalabs/ui/pull/326) [`b962820`](https://github.com/bazzalabs/ui/commit/b96282045168424cf6fd76d9efd1f5590b4c71fa) Thanks [@kianbazza](https://github.com/kianbazza)! - `Select`: use standard anchored positioning for searchable popups. `alignItemWithTrigger` now applies only while no search input is present — a `Select.Input` (always-visible, or a `hideUntilActive` input once it activates) makes the popup fall back to anchored positioning, matching Base UI (Select aligns, Combobox anchors). Also stop recomputing the aligned placement when the visible item count changes while open.

- [#327](https://github.com/bazzalabs/ui/pull/327) [`5df1835`](https://github.com/bazzalabs/ui/commit/5df1835b63cece491ed4d35e9215fd85275f090e) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix `Select` with `clearSearchOnClose="after-exit"` not clearing the search or deactivating a `hideUntilActive` input after the close animation, which left the search input visible on reopen.

- [#331](https://github.com/bazzalabs/ui/pull/331) [`31a5f0e`](https://github.com/bazzalabs/ui/commit/31a5f0e60c67f6e147e7eb0c4bb4a61368aafef1) Thanks [@kianbazza](https://github.com/kianbazza)! - Support a clearable `null` item in `Select` and `Combobox` (Base UI parity). Rendering `<Select.Item value={null}>` (or describing it via `items` as `{ value: null, label }`) adds an option that clears the selection when chosen; its label is used as the trigger/input placeholder, and it shows as selected while there is no value. `Select.Item`/`Combobox.Item` now accept `value={null}`, and `onValueChange` may receive `null` when the selection is cleared.

- [#325](https://github.com/bazzalabs/ui/pull/325) [`6fe6994`](https://github.com/bazzalabs/ui/commit/6fe6994adcb2a07ab1ce061a1b54b69431fc3359) Thanks [@kianbazza](https://github.com/kianbazza)! - Forward the `data-highlighted` attribute to `Select.ItemIndicator` so it reflects its parent item's highlighted state, matching `Select.Item`.

- [#330](https://github.com/bazzalabs/ui/pull/330) [`7975ad0`](https://github.com/bazzalabs/ui/commit/7975ad0ec1399ac515a0e48004a1dc60a996bc59) Thanks [@kianbazza](https://github.com/kianbazza)! - Extend the `items` prop on `Select.Root` and `Combobox.Root`. The array form now accepts `keywords` (extra filter terms merged into an item's search keywords) and a `null` value, e.g. `{ value: null, label: 'Select…' }`. Item keyword auto-population reads `items[].keywords`, so you no longer need a separate per-`Item` `keywords` prop when you already describe items via `items`.

- [#307](https://github.com/bazzalabs/ui/pull/307) [`1ae5d57`](https://github.com/bazzalabs/ui/commit/1ae5d579b14f7c2b89e4cbfec2f5d5b2528f0dd6) Thanks [@kianbazza](https://github.com/kianbazza)! - Unify the data-first popup menu API: `Surface`/`List`/`Input` now accept the data-first props directly and `Popup` auto-renders data subpages. Removes `DataSurface`, `DataList`, `DataInput`, and `DataSubpages`. This is a breaking change.

## 0.1.0-canary.6

### Patch Changes

- [#301](https://github.com/bazzalabs/ui/pull/301) [`f09158a`](https://github.com/bazzalabs/ui/commit/f09158a894304be01956230b4384f972f8b34b70) Thanks [@kianbazza](https://github.com/kianbazza)! - Fix video player buttons so composed button props no longer override internal button actions.

## 0.1.0-canary.5

### Patch Changes

- [#296](https://github.com/bazzalabs/ui/pull/296) [`be5a86f`](https://github.com/bazzalabs/ui/commit/be5a86f670fd50373f7491bc28a3ff99489b58d8) Thanks [@kianbazza](https://github.com/kianbazza)! - Compose video player component part event handlers so consumers can opt out of internal behavior with preventBaseUIHandler.

- [#294](https://github.com/bazzalabs/ui/pull/294) [`e969522`](https://github.com/bazzalabs/ui/commit/e9695221417b4dcabc1ffb09aa98a231df9d64ed) Thanks [@kianbazza](https://github.com/kianbazza)! - Compose video player root event handlers so consumer handlers run before internal behavior and can opt out with preventBaseUIHandler.

- [#295](https://github.com/bazzalabs/ui/pull/295) [`4a3c314`](https://github.com/bazzalabs/ui/commit/4a3c314ecba1df594baf2b5a6d1a889a3a724be9) Thanks [@kianbazza](https://github.com/kianbazza)! - Reset the video player idle timeout when focus enters the player or Tab navigation occurs inside it.

- [#297](https://github.com/bazzalabs/ui/pull/297) [`0e6afd8`](https://github.com/bazzalabs/ui/commit/0e6afd84ee4032a741fa727fb43d544dcd85ec35) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `autoPlay` support to the video player

## 0.1.0-canary.4

### Patch Changes

- [#291](https://github.com/bazzalabs/ui/pull/291) [`7838848`](https://github.com/bazzalabs/ui/commit/783884895643a1675cdb4cecfe9715d82e556911) Thanks [@kianbazza](https://github.com/kianbazza)! - Improve seek interactions so playback pauses while scrubbing and resumes afterward when appropriate, including pointer and keyboard-driven seeking.

- [#292](https://github.com/bazzalabs/ui/pull/292) [`51b3b02`](https://github.com/bazzalabs/ui/commit/51b3b0285b833387fa0e16791704506544f5e422) Thanks [@kianbazza](https://github.com/kianbazza)! - Fixes an issue where pressing the Space key does not toggle playback if the focused element is a range input, such as the seek slider

## 0.1.0-canary.3

### Minor Changes

- [#289](https://github.com/bazzalabs/ui/pull/289) [`8120e94`](https://github.com/bazzalabs/ui/commit/8120e9414bca93c49d703a1133a5defa86843944) Thanks [@kianbazza](https://github.com/kianbazza)! - Add `VideoPlayer` primitive component.

## 0.1.0-canary.2

### Patch Changes

- [#283](https://github.com/bazzalabs/ui/pull/283) [`d0c975d`](https://github.com/bazzalabs/ui/commit/d0c975de8f6effad9283322992e92460e039d8c2) Thanks [@kianbazza](https://github.com/kianbazza)! - Bumping...

## 0.1.0-canary.1

### Patch Changes

- [#282](https://github.com/bazzalabs/ui/pull/282) [`9c8bfbd`](https://github.com/bazzalabs/ui/commit/9c8bfbd5b2224872b33a115d15de6186cf2dbad3) Thanks [@kianbazza](https://github.com/kianbazza)! - Add a placeholder changeset to trigger the canary release PR.
