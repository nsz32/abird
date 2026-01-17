# Architecture

## Overview

Bird is an Electron app that wraps web applications as isolated desktop apps. Each website runs in its own `WebContentsView` with configurable behavior.

## Directory Structure

```
src/
├── main/               # Electron main process
│   ├── config/         # Configuration (store, resolver)
│   ├── core/           # App lifecycle, window, views, states
│   ├── tabs/           # Tab management
│   ├── views/          # UI views (NavBar, FindBar, etc.)
│   ├── services/       # Downloads, notifications, icons
│   ├── input/          # Keyboard/mouse handling
│   └── utils/          # Helpers (observable, platform, etc.)
├── preload/            # Context bridge (IPC API)
├── shared/             # Types shared between main/renderer
│   └── config.schema.ts  # Zod schemas (source of truth)
└── ui/                 # React overlays
    ├── navbar/         # Navigation bar
    ├── config/         # Settings UI
    ├── downloads/      # Downloads panel
    ├── findbar/        # Find in page
    └── notifications/  # Notification center
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    BirdConfig (JSON)                     │
│              User configuration file                     │
└────────────────────────┬────────────────────────────────┘
                         │ load/validate
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   config/store.ts                        │
│            Reads, writes, caches BirdConfig              │
└────────────────────────┬────────────────────────────────┘
                         │ resolve
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  config/resolver.ts                      │
│     Merges defaults + global + app → EffectiveConfig     │
└────────────────────────┬────────────────────────────────┘
                         │ emit
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 config$ (Observable)                     │
│              Runtime config, reactive                    │
└────────────────────────┬────────────────────────────────┘
                         │ subscribe
                         ▼
              ┌──────────┴──────────┐
              │                     │
        Main process           UI (via IPC)
```

## Key Patterns

### Observables (`utils/observable.ts`)

Reactive state management without external deps:

- `StateObservable<T>` — Simple state with subscribers
- `BroadcastObservable<T>` — Auto-sends to registered WebContents
- `CombinedObservable<T>` — Derives from multiple sources

### View Hierarchy

```
MainWindow (BaseWindow)
├── NavBar (PanelView)
├── NotificationCenter (PanelView)
├── FindBar (PanelView)
├── Watermark (PanelView)
└── Content area
    ├── Tab WebViews (BrowserView)
    └── Downloads panel (OverlayPanel)
```

### Configuration Layers

```
DEFAULT_NAVBAR (Zod defaults)
       ↓
BirdConfig.navBar (global user prefs)
       ↓
AppConfig.navBar (per-app overrides)
       ↓
EffectiveConfig (computed, emitted to config$)
```

## IPC Communication

- **Main → Renderer**: Observable broadcasts, direct `webContents.send()`
- **Renderer → Main**: `ipcRenderer.invoke()` via preload bridge
- **Channels**: Defined in `shared/types.ts` (`IpcChannels`)
