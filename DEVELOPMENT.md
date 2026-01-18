# Development

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

## Setup

```bash
pnpm install
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development mode with hot reload |
| `pnpm dev:local` | Dev with local `bird.config.json` |
| `pnpm start` | Run the built app |

### Quality

| Command | Description |
|---------|-------------|
| `pnpm lint` | Check code style |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | TypeScript validation |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:run` | Run tests once |

### Build & Package

| Command | Description |
|---------|-------------|
| `pnpm build` | Build for production |
| `pnpm package:linux` | Build + create AppImage |
| `pnpm install:linux` | Install AppImage to /usr/local/bin |

## Configuration

Bird uses a JSON config file (`bird.config.json` or `~/.config/bird/config.json`).

```bash
# Run with custom config
pnpm dev -- --config path/to/config.json

# Run specific app from config
pnpm dev -- --app myapp
```

## Debugging

### Main Process

```bash
# Electron devtools open by default in dev mode
pnpm dev
```

### Renderer (Overlays)

Right-click on navbar/panel → "Inspect Element" or use menu: View → Toggle DevTools

### Logs

All `console.log/error` from main process appear in terminal. Renderer logs appear in their respective devtools.

## Project Structure Quick Reference

```
src/main/config/     # Config loading and resolution
src/main/core/       # App entry, window, global state
src/main/tabs/       # Tab lifecycle
src/main/views/      # UI panels (NavBar, FindBar...)
src/shared/          # Types and schemas
src/ui/              # React components
```

## Adding a New Feature

1. **Types first** — Define in `shared/types.ts` or `config.schema.ts`
2. **State** — Add observable in `core/states.ts` if needed
3. **Main logic** — Implement in appropriate module
4. **IPC** — Add channel in `IpcChannels`, handler in `handlers.ts`
5. **UI** — Update React component, use `window.bird.*` API

## Useful Tips

- `config$.get()` — Current effective config
- `tabs$.get()` — All tabs
- `activeContentId$.get()` — Current visible content (tab or panel)
- Run `pnpm lint:fix` before committing
