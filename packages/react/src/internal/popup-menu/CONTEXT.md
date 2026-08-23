# Popup Menu (data-first)

The data-first popup-menu system in `@bazza-ui/react`: consumers describe menu content as declarative node definitions; the library resolves them into menu nodes, then renders, filters, deep-searches, and identifies rows.

Where it lives (`packages/react/src/internal/popup-menu/`):

- `menu-tree/` — the resolved-node model and the resolver (identity, reconcile, graft)
- `data-first/` — the pipeline that renders defs: list, subpages, filtering/deep search, async
- `components/`, `contexts/`, `hooks/` — the JSX parts and their plumbing

## Language

**Node Def**:
A user-authored, declarative description of one menu entry (item, checkbox item, radio item, submenu, subpage, tree item, group, separator). Plain data; never mutated by the library.
_Avoid_: node config, definition object

**Menu Node**:
The library-created, resolved instance of a node def — carries identity (resolved ID, definition key, definition path), tree links (parent, children), and a reference to its originating def. Exactly one per logical row per menu root, in every render context; created by resolution at the root, or by grafting. Surfaced to consumers as `Node` under each family namespace.
_Avoid_: resolved node (as a noun — "resolution" stays as the process), wrapper, instance

**Menu Tree**:
The single resolved node tree owned by one menu root, and the `MenuTreeResolver` that maintains it. Created once per root; re-supplied content reconciles into it rather than rebuilding it.
_Avoid_: node graph, model

**Display Node**:
The render-scoped wrapper the pipeline builds from node defs for one surface's current render (filtering, scoring, grouping applied). Rebuilt per render; context-dependent.
_Avoid_: row wrapper

**Definition Key** (field: `definitionKey`):
A node's single definition-path component: its explicit id verbatim when present, otherwise its slugified value. Every Node Def must have an explicit or inferred key; empty keys are diagnosed in development. `idScope` controls whether keys must be unique across the whole `menu` root or only within each `surface` (the default).
_Avoid_: segment, slug, part

**Definition Path** (`definitionPath`):
The segments from the menu root to a node in the definition tree, including the node's own segment. Only submenu and subpage ancestors contribute segments; groups, radio groups, and tree items are surface-transparent. Identical wherever the node renders — browse, deep search, or recursion.
_Avoid_: absolute path, tree path, full path, ancestor path

**Breadcrumbs**:
The branch nodes walked by the displaying surface to reach a row within its own render pass. Carries rich node references, not just segments.
_Avoid_: trail, crumb path

**Browse / Deep Search**:
The two render contexts: browsing renders each surface's own nodes in place; deep search flattens a subtree into the searching surface as results. A row's identity must not depend on which context displays it.

**Resolved ID** (`id`):
The unique identity of a menu node — the value persistent state, registration, and highlight key off. Produced once per root by `getResolvedId`; the default is `definitionKey` for `idScope="menu"`, or a total UTF-16 code-unit encoding of every Definition Path entry joined with `/` for `idScope="surface"`. The encoder preserves ASCII letters, digits, `.`, `_`, `~`, and `-`, and encodes every other code unit as `%` plus four lowercase hexadecimal digits. IDs are opaque. `idScope` and the selected resolver are read once when the root resolver is created; later prop changes have no effect. Custom resolution replaces only final ID generation, while `idScope` still controls Definition Key validation. Separator definitions require an authored `id`.
_Avoid_: composite id, qualified id

**Unresolved Menu Node** (`UnresolvedMenuNode`):
The definitional menu-node facts passed to `getResolvedId` before the resolved ID is assigned.

**Graft**:
Resolving node defs that arrive after mount (async loader results; render-time content) and attaching the resulting nodes under an already-resolved parent — the graft point — so they join the single resolved tree with correct lineage (definition path, Resolved ID).
_Avoid_: merge, inject, append

**Detached Node**:
The stable placeholder node produced for a def that is rendered but is not part of the resolved tree (a consumer passing an arbitrary def to `renderNode`). Dev-warned once per def; its id is root-relative rather than path-qualified. Not a supported authoring pattern — memoize defs and prefer explicit ids.
_Avoid_: orphan node, temp node

**Listbox**:
The state layer beneath the engine: rows register into a `ListboxStore`, which owns highlight state and keyboard navigation. Implements the WAI-ARIA listbox pattern; shared by every menu family.
_Avoid_: list store, selection engine

## Removed vocabulary

These terms described the string-based identity model and no longer exist in the code. They appear here only so the names are not reintroduced with new meanings.

- **Row Id Strategy** (`rowIdStrategy`: `qualified` / `explicit` / `hybrid`) and `getQualifiedRowId` — superseded by the `getResolvedId` seam. `hybrid` has no successor: it made ids depend on render context, which the resolved-node model forbids by construction.
- **Row ID** / `getRowId` — replaced by Resolved ID / `getResolvedId`.
- **Segment** / `pathSegment` — replaced by Definition Key / `definitionKey`.
- **Display Path** (`displayPath`) — the segments of the submenus enclosing the surface a row was displayed in. Contextual by nature; deleted along with the strategy machinery that consumed it.
