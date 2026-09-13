/**
 * Registry Index
 *
 * Hand-maintained index that exports all registry components with React.lazy()
 * for code-splitting. This enables preview components to dynamically load
 * examples without bundling them all upfront.
 *
 * Registry item types:
 * - registry:example - Example components demonstrating usage
 * - registry:block - Full-page block demos
 * - registry:ui - UI component wrappers (not rendered directly)
 *
 * Examples are organized by tier, mirroring the filesystem:
 *
 *   examples.components['dropdown-menu'].basic
 *   → registry/examples/styled/dropdown-menu/basic/index.tsx
 *
 *   examples.primitives['dropdown-menu'].basic   (future)
 *   → registry/examples/primitives/dropdown-menu/basic/index.tsx
 *
 * The public name (used by `<Example name="..." />` in MDX) is derived as
 * `{group}-{key}` (e.g. `dropdown-menu-basic`) unless overridden, so the same
 * name can resolve to a different variant per docs tier.
 */

import * as React from 'react'

// =============================================================================
// Types
// =============================================================================

export type RegistryTier = 'components' | 'primitives'

export interface RegistryEntry {
  name: string
  type: 'registry:example' | 'registry:block' | 'registry:ui'
  /** Docs tier this entry belongs to (examples only) */
  tier?: RegistryTier
  component: React.LazyExoticComponent<React.ComponentType<unknown>>
  files: string[]
}

export type RegistryIndex = Record<string, RegistryEntry>

// =============================================================================
// Example authoring helpers
// =============================================================================
//
// Standard example (folder with index.tsx), 1 line:
//
//   basic: ex(() => import('@/registry/examples/styled/dropdown-menu/basic')),
//
// Multi-file example — extra files are relative to the example directory and
// shown as tabs in the code viewer, after index.tsx:
//
//   search: ex(
//     () => import('@/registry/examples/styled/dropdown-menu/search'),
//     { extraFiles: ['data.ts'] },
//   ),
//
// Irregular entries (flat files, custom public names) can override `name` and
// `files` (paths relative to `registry/examples/{tier}/`).
//
// The `import()` specifier must stay a static string literal so the bundler
// can code-split each example into its own chunk.

type ExampleLoader = () => Promise<{ default: React.ComponentType<unknown> }>

interface ExampleOptions {
  /**
   * Extra files inside the example directory (after index.tsx),
   * shown as tabs in the code viewer.
   */
  extraFiles?: string[]
  /** Override the public registry name (defaults to `{group}-{key}`) */
  name?: string
  /**
   * Override the full file list.
   * Paths are relative to `registry/examples/{tier}/`.
   */
  files?: string[]
}

interface ExampleDef extends ExampleOptions {
  load: ExampleLoader
}

function ex(load: ExampleLoader, options: ExampleOptions = {}): ExampleDef {
  return { load, ...options }
}

type ExampleGroupDefs = Record<string, Record<string, ExampleDef>>

type BuiltExamples<T extends ExampleGroupDefs> = {
  [G in keyof T]: { [K in keyof T[G]]: RegistryEntry }
}

/**
 * Builds full registry entries from terse example definitions, deriving the
 * public name, tier, and file paths from the entry's position in the tree.
 */
function defineExamples<T extends ExampleGroupDefs>(
  tier: RegistryTier,
  groups: T,
): BuiltExamples<T> {
  const built: Record<string, Record<string, RegistryEntry>> = {}

  for (const [group, defs] of Object.entries(groups)) {
    const builtGroup: Record<string, RegistryEntry> = {}

    for (const [key, def] of Object.entries(defs)) {
      const tierRoot = `registry/examples/${tier}`
      const dir = `${tierRoot}/${group}/${key}`

      const files = def.files
        ? def.files.map((file) => `${tierRoot}/${file}`)
        : [
            `${dir}/index.tsx`,
            ...(def.extraFiles ?? []).map((file) => `${dir}/${file}`),
          ]

      builtGroup[key] = {
        name: def.name ?? `${group}-${key}`,
        type: 'registry:example',
        tier,
        component: React.lazy(def.load),
        files,
      }
    }

    built[group] = builtGroup
  }

  return built as BuiltExamples<T>
}

/** Flattens a tier's groups into a public-name → entry lookup map. */
function flattenExamples(
  groups: Record<string, Record<string, RegistryEntry>>,
): RegistryIndex {
  const flat: RegistryIndex = {}

  for (const group of Object.values(groups)) {
    for (const entry of Object.values(group)) {
      if (flat[entry.name]) {
        throw new Error(
          `Duplicate example name "${entry.name}" in registry tier "${entry.tier}"`,
        )
      }
      flat[entry.name] = entry
    }
  }

  return flat
}

// =============================================================================
// Examples
// =============================================================================

export const examples = {
  components: defineExamples('components', {
    'dropdown-menu': {
      basic: ex(() => import('@/registry/examples/styled/dropdown-menu/basic')),
      'close-on-click': ex(
        () => import('@/registry/examples/styled/dropdown-menu/close-on-click'),
      ),
      'hidden-input': ex(
        () => import('@/registry/examples/styled/dropdown-menu/hidden-input'),
      ),
      checkbox: ex(
        () => import('@/registry/examples/styled/dropdown-menu/checkbox'),
      ),
      'checkbox-indicator-variants': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/checkbox-indicator-variants'
          ),
      ),
      radio: ex(() => import('@/registry/examples/styled/dropdown-menu/radio')),
      submenu: ex(
        () => import('@/registry/examples/styled/dropdown-menu/submenu'),
      ),
      'subpage-linear': ex(
        () => import('@/registry/examples/styled/dropdown-menu/subpage-linear'),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
      subpage: ex(
        () => import('@/registry/examples/styled/dropdown-menu/subpage'),
      ),
      'linear-subpage-label-creation': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/linear-subpage-label-creation'
          ),
      ),
      search: ex(
        () => import('@/registry/examples/styled/dropdown-menu/search'),
        { extraFiles: ['data.ts'] },
      ),
      'deep-search': ex(
        () => import('@/registry/examples/styled/dropdown-menu/deep-search'),
      ),
      'deep-search-linear': ex(
        () =>
          import('@/registry/examples/styled/dropdown-menu/deep-search-linear'),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
      'tree-linear': ex(
        () => import('@/registry/examples/styled/dropdown-menu/tree-linear'),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
      'deep-search-subpages-linear': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/deep-search-subpages-linear'
          ),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
      'deep-search-linear-async': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/deep-search-linear-async'
          ),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
      'deep-search-linear-async-tanstack': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/deep-search-linear-async-tanstack'
          ),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
      'async-deep-search': ex(
        () =>
          import('@/registry/examples/styled/dropdown-menu/async-deep-search'),
      ),
      virtualized: ex(
        () => import('@/registry/examples/styled/dropdown-menu/virtualized'),
      ),
      gifi: ex(() => import('@/registry/examples/styled/dropdown-menu/gifi'), {
        extraFiles: ['data.ts'],
      }),
      'virtualized-groups': ex(
        () =>
          import('@/registry/examples/styled/dropdown-menu/virtualized-groups'),
      ),
      'virtualized-advanced': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/virtualized-advanced'
          ),
      ),
      async: ex(() => import('@/registry/examples/styled/dropdown-menu/async')),
      'footer-actions': ex(
        () => import('@/registry/examples/styled/dropdown-menu/footer-actions'),
      ),
      'header-toolbar': ex(
        () => import('@/registry/examples/styled/dropdown-menu/header-toolbar'),
      ),

      // Guide snippets: flat files with stable slash-namespaced public names
      'guides/your-first-menu/surface-hidden-input': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/guides/your-first-menu/surface-hidden-input'
          ),
        {
          name: 'guides/dropdown-menu/your-first-menu/surface-hidden-input',
          files: [
            'dropdown-menu/guides/your-first-menu/surface-hidden-input.tsx',
          ],
        },
      ),
      'guides/your-first-menu/01-initial': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/guides/your-first-menu/items-01'
          ),
        {
          name: 'guides/dropdown-menu/your-first-menu/01-initial',
          files: ['dropdown-menu/guides/your-first-menu/items-01.tsx'],
        },
      ),
      'guides/your-first-menu/items-02': ex(
        () =>
          import(
            '@/registry/examples/styled/dropdown-menu/guides/your-first-menu/items-02'
          ),
        {
          name: 'guides/dropdown-menu/your-first-menu/items-02',
          files: ['dropdown-menu/guides/your-first-menu/items-02.tsx'],
        },
      ),
    },

    select: {
      basic: ex(() => import('@/registry/examples/styled/select/basic')),
      groups: ex(() => import('@/registry/examples/styled/select/groups')),
      search: ex(() => import('@/registry/examples/styled/select/search')),
      form: ex(() => import('@/registry/examples/styled/select/form')),
      'object-values': ex(
        () => import('@/registry/examples/styled/select/object-values'),
      ),
    },

    'video-player': {
      linear: ex(
        () => import('@/registry/examples/styled/video-player/linear'),
        { extraFiles: ['icons.tsx'] },
      ),
      modern: ex(
        () => import('@/registry/examples/styled/video-player/modern'),
        { extraFiles: ['icons.tsx'] },
      ),
      youtube: ex(
        () => import('@/registry/examples/styled/video-player/youtube'),
        { extraFiles: ['icons.tsx'] },
      ),
    },
    'command-menu': {
      basic: ex(() => import('@/registry/examples/styled/command-menu/basic')),
      linear: ex(
        () => import('@/registry/examples/styled/command-menu/linear'),
        { extraFiles: ['components.tsx', 'icons.tsx'] },
      ),
    },
  }),

  // Unstyled example variants live here as primitives docs pages adopt them.
  // A primitives example with the same `{group}-{key}` as a components example
  // is resolved automatically on `/docs/primitives/*` pages.
  primitives: defineExamples('primitives', {
    'dropdown-menu': {
      basic: ex(
        () => import('@/registry/examples/primitives/dropdown-menu/basic'),
      ),
      'close-on-click': ex(
        () =>
          import('@/registry/examples/primitives/dropdown-menu/close-on-click'),
      ),
    },
  }),
}

/** Flat public-name → entry lookup maps, one per tier. */
export const examplesByTier: Record<RegistryTier, RegistryIndex> = {
  components: flattenExamples(examples.components),
  primitives: flattenExamples(examples.primitives),
}

// =============================================================================
// Blocks
// =============================================================================

export const blocks: RegistryIndex = {
  'filters-01': {
    name: 'filters-01',
    type: 'registry:block',
    component: React.lazy(() => import('@/registry/blocks/filters-01/page')),
    files: [
      'registry/blocks/filters-01/page.tsx',
      'registry/blocks/filters-01/_/components/issues-table.tsx',
      'registry/blocks/filters-01/_/components/data-table.tsx',
      'registry/blocks/filters-01/_/lib/columns.tsx',
      'registry/blocks/filters-01/_/lib/data.ts',
      'registry/blocks/filters-01/_/lib/filters.tsx',
    ],
  },
}

// =============================================================================
// UI Components (for reference, not directly rendered)
// =============================================================================

// Helper to create a null component for UI entries (they're not rendered directly)
const createNullComponent = () =>
  React.lazy(() => Promise.resolve({ default: () => null }))

export const ui: RegistryIndex = {
  'command-menu': {
    name: 'command-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/command-menu/index.tsx'],
  },
  'context-menu': {
    name: 'context-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/context-menu/index.tsx'],
  },
  'dropdown-menu': {
    name: 'dropdown-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/dropdown-menu/index.tsx'],
  },
  select: {
    name: 'select',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/select/index.tsx'],
  },
  'multi-select': {
    name: 'multi-select',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/multi-select/index.tsx'],
  },
  filter: {
    name: 'filter',
    type: 'registry:ui',
    component: createNullComponent(),
    files: [
      'registry/ui/filter/index.ts',
      'registry/ui/filter/index.parts.ts',
      'registry/ui/filter/cmdk/index.ts',
      'registry/ui/filter/cmdk/index.parts.ts',
      'registry/ui/filter/cmdk/components/menu/filter-menu.tsx',
      'registry/ui/filter/cmdk/components/item/filter-operator.tsx',
      'registry/ui/filter/cmdk/components/item/filter-value.tsx',
      'registry/ui/filter/components/root/filter-root.tsx',
      'registry/ui/filter/components/provider/filter-provider.tsx',
      'registry/ui/filter/components/root/filter-context.tsx',
      'registry/ui/filter/components/trigger/filter-trigger.tsx',
      'registry/ui/filter/components/list/filter-list.tsx',
      'registry/ui/filter/components/list/filter-list-mobile-container.tsx',
      'registry/ui/filter/components/item/filter-item.tsx',
      'registry/ui/filter/components/item/filter-subject.tsx',
      'registry/ui/filter/components/item/filter-remove.tsx',
      'registry/ui/filter/components/actions/filter-actions.tsx',
      'registry/ui/filter/components/value/types.ts',
      'registry/ui/filter/components/value/filter-value-date-controller.tsx',
      'registry/ui/filter/components/value/filter-value-number-controller.tsx',
      'registry/ui/filter/hooks/use-debounce-callback.tsx',
      'registry/ui/filter/hooks/use-unmount.tsx',
      'registry/ui/filter/lib/debounce.ts',
      'registry/ui/filter/ui/debounced-input.tsx',
    ],
  },
  'filter/cmdk': {
    name: 'filter/cmdk',
    type: 'registry:ui',
    component: createNullComponent(),
    files: [
      'registry/ui/filter/cmdk/index.ts',
      'registry/ui/filter/cmdk/index.parts.ts',
      'registry/ui/filter/cmdk/components/menu/filter-menu.tsx',
      'registry/ui/filter/cmdk/components/item/filter-operator.tsx',
      'registry/ui/filter/cmdk/components/item/filter-value.tsx',
      'registry/ui/filter/components/root/filter-root.tsx',
      'registry/ui/filter/components/provider/filter-provider.tsx',
      'registry/ui/filter/components/root/filter-context.tsx',
      'registry/ui/filter/components/trigger/filter-trigger.tsx',
      'registry/ui/filter/components/list/filter-list.tsx',
      'registry/ui/filter/components/list/filter-list-mobile-container.tsx',
      'registry/ui/filter/components/item/filter-item.tsx',
      'registry/ui/filter/components/item/filter-subject.tsx',
      'registry/ui/filter/components/item/filter-remove.tsx',
      'registry/ui/filter/components/actions/filter-actions.tsx',
      'registry/ui/filter/components/value/types.ts',
      'registry/ui/filter/components/value/filter-value-date-controller.tsx',
      'registry/ui/filter/components/value/filter-value-number-controller.tsx',
      'registry/ui/filter/hooks/use-debounce-callback.tsx',
      'registry/ui/filter/hooks/use-unmount.tsx',
      'registry/ui/filter/lib/debounce.ts',
      'registry/ui/filter/ui/debounced-input.tsx',
    ],
  },
  'filter/dropdown-menu': {
    name: 'filter/dropdown-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: [
      'registry/ui/filter/dropdown-menu/index.ts',
      'registry/ui/filter/dropdown-menu/index.parts.ts',
      'registry/ui/filter/components/root/filter-root.tsx',
      'registry/ui/filter/components/provider/filter-provider.tsx',
      'registry/ui/filter/components/root/filter-context.tsx',
      'registry/ui/filter/components/menu/filter-menu.tsx',
      'registry/ui/filter/components/trigger/filter-trigger.tsx',
      'registry/ui/filter/components/list/filter-list.tsx',
      'registry/ui/filter/components/list/filter-list-mobile-container.tsx',
      'registry/ui/filter/components/item/filter-item.tsx',
      'registry/ui/filter/components/item/filter-subject.tsx',
      'registry/ui/filter/components/item/filter-operator.tsx',
      'registry/ui/filter/components/item/filter-value.tsx',
      'registry/ui/filter/components/item/filter-remove.tsx',
      'registry/ui/filter/components/actions/filter-actions.tsx',
      'registry/ui/filter/components/value/index.ts',
      'registry/ui/filter/components/value/types.ts',
      'registry/ui/filter/components/value/option-item.tsx',
      'registry/ui/filter/components/value/text-item.tsx',
      'registry/ui/filter/components/value/selectable-menu.ts',
      'registry/ui/filter/components/value/text-menu.tsx',
      'registry/ui/filter/components/value/editors/index.ts',
      'registry/ui/filter/components/value/editors/option-editor.tsx',
      'registry/ui/filter/components/value/editors/text-editor.tsx',
      'registry/ui/filter/components/value/filter-value-date-controller.tsx',
      'registry/ui/filter/components/value/filter-value-number-controller.tsx',
      'registry/ui/filter/hooks/use-debounce-callback.tsx',
      'registry/ui/filter/hooks/use-unmount.tsx',
      'registry/ui/filter/lib/debounce.ts',
      'registry/ui/filter/ui/debounced-input.tsx',
    ],
  },
}

// =============================================================================
// Combined Registry
// =============================================================================

/**
 * Flat lookup across all entry types.
 * For tier-less example lookups, components-tier entries take precedence.
 */
export const registry: RegistryIndex = {
  ...examplesByTier.primitives,
  ...examplesByTier.components,
  ...blocks,
  ...ui,
}

/**
 * Get an example entry by public name.
 *
 * When `tier` is provided, that tier is preferred and the other tier is used
 * as a fallback — so tiered docs pages automatically pick up a tier-specific
 * variant when one exists, without changing MDX.
 */
export function getExampleEntry(
  name: string,
  tier?: RegistryTier,
): RegistryEntry | undefined {
  if (tier) {
    const fallback: RegistryTier =
      tier === 'components' ? 'primitives' : 'components'
    return examplesByTier[tier][name] ?? examplesByTier[fallback][name]
  }

  return examplesByTier.components[name] ?? examplesByTier.primitives[name]
}

/**
 * Get a registry entry by name.
 * Examples are resolved tier-aware; blocks and ui entries ignore `tier`.
 */
export function getRegistryEntry(
  name: string,
  tier?: RegistryTier,
): RegistryEntry | undefined {
  return getExampleEntry(name, tier) ?? blocks[name] ?? ui[name]
}

/**
 * Get all registry entries of a specific type
 */
export function getRegistryEntriesByType(
  type: RegistryEntry['type'],
): RegistryEntry[] {
  return Object.values(registry).filter((entry) => entry.type === type)
}

/**
 * Check if a registry entry exists
 */
export function hasRegistryEntry(name: string): boolean {
  return name in registry
}
