# Contributing

## Code Philosophy

**Minimalism and readability above all.** We believe the best code is self-documenting.

### Principles

- **Document functions** — Brief comment before functions, avoid comments inside (code should be self-explanatory)
- **Logical grouping** — Use blank lines to separate logical blocks within functions
- **DRY, KISS, YAGNI** — No premature abstractions, no over-engineering
- **SOLID** — Single responsibility, clean interfaces

### What We Avoid

- Inline comments explaining "what" (code should be obvious)
- Abstractions for single-use cases
- Feature flags or backwards-compatibility shims
- Defensive coding against impossible scenarios

## Code Style

- **TypeScript strict mode** — No `any`, proper typing
- **Biome** — Formatting and linting (`pnpm lint`)
- **Imports** — Organized automatically by Biome

```typescript
// Good: Self-explanatory, logically grouped
function createTab(url: string): Tab {
    const config = config$.get()
    const tab = new Tab(config.partition, url)

    insertTab(tab)
    activateTab(tab.id)

    return tab
}

// Bad: Needs comments = unclear code
function createTab(url: string): Tab {
    // Get the config
    const config = config$.get()
    // Create the tab with partition
    const tab = new Tab(config.partition, url)
    // ...
}
```

## Architecture

### Key Patterns

- **Observable suffix `$`** — All observables end with `$` (e.g., `config$`, `tabs$`, `navState$`)
- **Handler prefix `handle`** — Functions handling events (e.g., `handleNavigation`)
- **Callback prefix `on`** — Event callbacks (e.g., `onNavStateChanged`)
- **Zod = Types** — All config types are inferred from Zod schemas (`z.infer<typeof schema>`)

### State Management

Bird uses custom observables without external dependencies:

```typescript
// StateObservable — Simple state with subscribers
const tabs$ = new StateObservable<Tab[]>([])

// BroadcastObservable — Auto-sends to registered WebContents
const config$ = new BroadcastObservable<EffectiveConfig>(defaultConfig)

// CombinedObservable — Derives from multiple sources
const navBarVisible$ = new CombinedObservable(
    [config$, forceShow$],
    ([config, force]) => config.navBar.visible || force
)
```

### Process Separation

- **Main process** (`src/main/`) — Source of truth for config, state, navigation
- **Preload** (`src/preload/`) — Context bridge exposing `window.bird.*` API
- **Renderer** (`src/ui/`) — React overlays, display-only, communicates via IPC

## Commits

- Concise, factual messages
- One logical change per commit
- Format: `<type>: <description>` (e.g., `fix: tab close selection`)

Types: `feat`, `fix`, `refactor`, `docs`, `build`, `chore`

## Pull Requests

- Small, focused changes
- Run `pnpm check` before submitting (lint + typecheck)
- No PR for formatting-only changes (use `pnpm lint:fix`)

## Development Setup

```bash
pnpm install
pnpm dev              # Development with hot reload
pnpm check            # Lint + typecheck
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions.
