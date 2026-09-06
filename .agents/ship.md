# Ship config

## Linear team

**bazza/ui** (key `UI`, id `c750e0fc-8df6-45d1-8672-c7966c81e39b`)

States: Triage, Backlog, Icebox, Todo, In Progress, In Review, Ready, Canary, Done, Canceled, Duplicate.
Note: this team has a `Canary` state (merged to canary branch, published as canary release). Ship's "Done" transition happens at reconcile when work merges; use `Canary` for work merged to the canary trunk but not yet in a stable release. `Ready` is also in use for merged-to-canary work (e.g. the resolver stacks); parents should match their sub-issues' state at reconcile.

## Toolchain

- Package manager: **bun** exclusively (never npm/yarn/pnpm/npx). Monorepo: Turborepo + bun workspaces.
- Lint/format: `bun run check` (check only) / `bun run check:fix` (Biome)
- Typecheck: `bun run type-check` (turbo; scope: `bun run type-check --filter <pkg>`)
- Build: `bun run build` (turbo; scope: `bun run build --filter <pkg>`)
- Test: `bun run test` (Vitest via turbo; scope: `bun run test --filter <pkg>`)
- Registry build: `bun run registry:build`
- Changesets: `bun run changeset` to add; publish scripts in root `package.json` (`ci:publish` lists packages explicitly — new publishable packages must be added there)
- No DB/migrations in this repo (demo DB for examples lives in `apps/web` with `drizzle.config.ts` + seed script when present)

## Vocabulary

This repo maintains a domain glossary. Presence of this section enables ship's vocabulary behaviors (see the ship skill's config gates).

- **Map**: `CONTEXT-MAP.md` (repo root) — read it first; it lists the contexts and their relationships.
- **Contexts**: `packages/react/CONTEXT.md` (consumer-facing component language) and `packages/react/src/internal/popup-menu/CONTEXT.md` (engine-internal identity/resolution language). Placement principle: if a consumer must speak the term, it belongs in the react context; if only maintainers speak it, the engine context.
- **ADRs**: `docs/adr/` (system-wide). Offer ADRs per the `domain-modeling` skill's three criteria.
- **Discipline**: specs and issues use canonical terms and respect each entry's *Avoid* list; reviewers treat avoid-list violations as findings. New or contested terms are resolved via the `domain-modeling` skill, not improvised.
- **Explore-phase vocabulary**: when the first new term crystallises during `ship explore`, lazily create a placeholder issue — title `Explore: <topic>`, Backlog, label `exploration` — and a worktree from its branch name (`wt switch -c <gitBranchName>`); commit vocabulary changes there so they ride the exploration's lifecycle. Two-track rule: vocabulary naming *existing* code may go straight to a trunk-bound branch (or a `ship quick`); vocabulary for *not-yet-built* concepts stays in the exploration worktree. At closeout the placeholder is promoted (linked to/replaced by the plan's parent issue) or canceled with a reason; `ship reconcile` sweeps zombie `exploration` placeholders.

## Reference repositories

None.

## Environment notes

- **Never run `bun run dev`** — assume the dev server is already running.
- Worktrees via worktrunk (`wt`); Graphite (`gt`) owns branches/commits/PRs. Trunks: `main` and `canary`; default branch for new work: **canary**.
- Worktree env files: `wt step copy-ignored` + root `.worktreeinclude` whitelist copy `.env` / `.env.local` (root and nested) into new worktrees via the `[pre-start]` hook in `.config/wt.toml`.
- New publishable packages live in `packages/<name>` (npm scope `@bazza-ui/<name>`); registry UI components live in `apps/web/registry/ui/<name>` (`@bazza-ui/registry-<name>`, private).
