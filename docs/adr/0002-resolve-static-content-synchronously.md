# Resolve static content synchronously during render; graft loader results in effects

The popup-menu engine's root data list feeds node defs into the Menu Tree resolver. Resolution of the static `content` prop happens synchronously during render, keyed on the `content` array's own reference, so the first render already has Menu Nodes and no empty frame is shown. Loader results are the only defs that arrive after mount; the decision is that they are grafted from effects, never from render. The resolver's reference fast-path (`setContent`/`graft` are no-ops when handed the same array) is correct precisely because the key is the true input, not a derived array. An earlier attempt keyed resolution on arrays rebuilt every render (merged async content) and produced an infinite render loop; the fix is the keying rule, not moving all resolution into effects.

## Considered Options

- **Resolve everything in effects** — a clean "never mutate during render" rule, but the first render has no nodes, causing an empty frame and complicating SSR/hydration.
- **`useSyncExternalStore` over the resolver** — the React-blessed shape for an external mutable source, but it adds a subscription layer for a store that has exactly one writer. Revisit if the resolver gains multiple writers.
