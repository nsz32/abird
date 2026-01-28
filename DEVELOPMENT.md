# Development

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** (any recent version)

## Setup

```bash
pnpm install
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development mode with hot reload (uses `abird.config.dev.json`) |
| `pnpm dev:bare` | Development mode without config file |
| `pnpm start` | Run the built app |

### Quality

| Command | Description |
|---------|-------------|
| `pnpm lint` | Check code style (Biome) |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format code (Biome) |
| `pnpm typecheck` | TypeScript validation |
| `pnpm check` | Run lint + typecheck together |
| `pnpm knip` | Find unused code and dependencies |

### Build & Package

| Command | Description |
|---------|-------------|
| `pnpm build` | Build for production (generates icons + schema + bundle) |
| `pnpm build:fresh` | Clean + build |
| `pnpm clean` | Remove `out/` and `release/` directories |
| `pnpm package:appimage` | Build + create AppImage (Linux) |
| `pnpm package:win` | Build + create NSIS installer (Windows) |

### Generation

| Command | Description |
|---------|-------------|
| `pnpm gen:schema` | Generate `abird.config.schema.json` for IDE autocomplete |
| `pnpm gen:icons` | Generate icons from SVG source |

## Configuration

ABird uses a JSON config file (`abird.config.dev.json` or `~/.config/abird/config.json`).

```bash
# Run with custom config
pnpm dev -- --config path/to/config.json

# Run specific app from config
pnpm dev -- --app myapp

# Browser mode (direct URL)
pnpm dev -- https://example.com

# Kiosk mode
pnpm dev -- --app dashboard --kiosk Ctrl+Alt+K
```

### IDE Support

Run `pnpm gen:schema` to generate `abird.config.schema.json`. Add this to your config file for autocomplete:

```json
{
  "$schema": "./abird.config.schema.json",
  "apps": { ... }
}
```

## Debugging

### Main Process

```bash
# Electron DevTools open by default in dev mode
pnpm dev
```

All `console.log/error` from main process appear in terminal.

### Renderer (Overlays)

- Right-click on navbar/panel → "Inspect Element"
- Or use menu: View → Toggle DevTools

Renderer logs appear in their respective DevTools.

### Useful Debug Tools

```bash
# Check for unused exports
pnpm knip

# Full quality check before commit
pnpm check
```

## Project Structure Quick Reference

```
src/
├── main/                # Electron main process
│   ├── config/          # Config loading, validation, resolution
│   ├── core/            # App bootstrap, window, states, routing
│   ├── tabs/            # Tab lifecycle management
│   ├── views/           # UI overlays (NavBar, FindBar, etc.)
│   ├── services/        # Business services (downloads, partitions, deploy)
│   ├── input/           # Keyboard listener, app menu
│   ├── utils/           # Observables, platform utils, user-agents
│   └── handlers.ts      # All IPC handlers
├── preload/             # Context bridge (window.abird.* API)
├── shared/              # Types, schemas, i18n
│   ├── config.schema.ts # Zod schemas (source of truth)
│   ├── types.ts         # TypeScript types, IPC channels
│   └── i18n/            # 10 languages
└── ui/                  # React overlays
    ├── shared/          # Shared hooks (useBirdState, useTranslations)
    ├── config/          # Configuration app (pages, components)
    ├── navbar/          # Navigation bar overlay
    ├── downloads/       # Downloads panel
    ├── findbar/         # Find-in-page overlay
    ├── notifications/   # Notifications overlay
    └── watermark/       # Background watermark
```

## Adding a New Feature

1. **Types first** — Define in `shared/types.ts` or `shared/config.schema.ts`
2. **State** — Add observable in `core/states.ts` if needed
3. **Main logic** — Implement in appropriate module
4. **IPC** — Add channel in `IpcChannels`, handler in `handlers.ts`
5. **UI** — Update React component, use `window.abird.*` API

### Example: Adding a new config option

```typescript
// 1. shared/config.schema.ts — Add to schema
const AppConfigSchema = z.object({
  // ...existing fields
  myNewOption: z.boolean().default(false),
})

// 2. main/config/resolver.ts — Handle in resolution if needed
// 3. main/core/states.ts — Add observable if runtime state
// 4. src/ui/config/components/ — Add UI control
```

## Useful Tips

```typescript
// Get current effective config
config$.get()

// Get all tabs
tabs$.get()

// Get current visible content (tab or panel)
activeContentId$.get()

// Subscribe to changes
config$.subscribe((config) => {
  console.log('Config changed:', config)
})
```

## Common Issues

### Hot reload not working?

The main process doesn't hot reload. Restart `pnpm dev` for main process changes.

### Config changes not applied?

Check that the config file path is correct. In dev mode, `abird.config.dev.json` in project root is used.

### Native module errors?

```bash
pnpm install  # Rebuilds native modules for your Electron version
```

### Icons not showing?

```bash
pnpm gen:icons  # Regenerate from SVG source
```
