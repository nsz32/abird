# Contributing

## Code Philosophy

**Minimalism and readability above all.** We believe the best code is self-documenting.

### Principles

- **No comments needed** — If code requires a comment, rewrite it to be clearer
- **Logical grouping** — Use blank lines to separate logical blocks within functions
- **DRY, KISS, YAGNI** — No premature abstractions, no over-engineering
- **SOLID** — Single responsibility, clean interfaces

### What We Avoid

- Comments explaining "what" (code should be obvious)
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

## Commits

- Concise, factual messages
- One logical change per commit
- Format: `<type>: <description>` (e.g., `fix: tab close selection`)

## Pull Requests

- Small, focused changes
- Run `pnpm lint` and `pnpm typecheck` before submitting
- No PR for formatting-only changes (use `pnpm lint --write`)
