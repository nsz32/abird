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
│   ├── config.schema.ts  # Zod schemas (source of truth)
│   ├── types.ts        # IPC types, API interface
│   ├── routing.ts      # URL routing utilities
│   └── i18n/           # Translation files
└── ui/                 # React overlays
    ├── shared/         # Shared hooks and utilities
    │   └── hooks/      # useBirdState, useTranslations
    ├── config/         # Settings UI (full-page app)
    │   ├── hooks/      # Config-specific hooks
    │   ├── utils/      # Config utilities (format, validation, partitions)
    │   ├── pages/      # HomePage, AppPage, PartitionPage
    │   └── components/ # Reusable UI components
    ├── navbar/         # Navigation bar overlay
    ├── downloads/      # Downloads panel overlay
    ├── findbar/        # Find in page overlay
    ├── notifications/  # Notification center overlay
    └── watermark/      # Watermark overlay
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

## UI Patterns

### Custom Hooks

**`useBirdState<T>()`** — Universal main-to-renderer synchronization:
```typescript
const state = useBirdState(
  getInitial: () => Promise<T>,        // Initial fetch
  subscribe: (cb) => unsubscribe,      // Subscribe to changes
  initialValue?: T                     // Optional default
)
```
Used throughout UI to sync with main process state (config, tabs, partitions, etc.)

**Config-specific hooks** (`ui/config/hooks/`):
- `useAppDeploy()` — Desktop shortcut deployment (status, deploy/undeploy)
- `useAppIcon()` — Icon loading and dimension tracking
- `useAutoRedeploy()` — Automatic redeployment on icon change
- `useLaunchSupport()` — Platform capability checking

**`useHashRouter()`** — Client-side routing via `window.location.hash`:
- No build-time complexity, just native browser navigation
- Methods: `navigate()`, `replace()`, `goBack()`

### Utilities Organization

**Config utilities** (`ui/config/utils/`):
- `partitions.ts` — Derive partition lists, usage maps, name validation
- `format.ts` — Display formatting (bytes, dates)
- `nameValidation.ts` — Folder name validation (cross-platform)

**Shared hooks** (`ui/shared/hooks/`):
- `useBirdState` — IPC state synchronization pattern
- `useTranslations` — i18n with singleton cache

### Component Structure

Config UI follows a clear hierarchy:
```
App.tsx (root + router)
├── pages/              # Hash-routed pages
│   ├── HomePage        # Dashboard + global settings
│   ├── AppPage         # Per-app configuration
│   └── PartitionPage   # Partition management
└── components/         # Reusable UI elements
    ├── Forms           # SwitchField, PositionSelect, ThemeSelect
    ├── Lists           # AppList, PartitionList
    ├── Dialogs         # Create, Edit, Rename, IconPicker
    └── Editors         # RoutingRulesEditor, NavBarConfigForm
```

## IPC Communication

- **Main → Renderer**: Observable broadcasts, direct `webContents.send()`
- **Renderer → Main**: `ipcRenderer.invoke()` via preload bridge
- **Channels**: Defined in `shared/types.ts` (`IpcChannels`)

### API Surface (`window.bird`)

The preload bridge exposes a type-safe API:
```typescript
window.bird = {
  navigation,      // Navigation controls
  tabs,           // Tab management
  config,         // Get effective config
  navbar,         // Navbar resize
  notifications,  // Notification center
  downloads,      // Downloads management
  find,           // Find in page
  keyboard,       // Keyboard state
  settings,       // Read/write user config
  i18n,           # Translations
  icons,          // Icon fetching and storage
  deploy,         // Desktop shortcut deployment
  partition,      // Partition management
  app,            // App launching
}
```

Each namespace follows consistent patterns:
- `get*()` / `list()` — Fetch current state
- `on*Changed()` — Subscribe to updates (returns unsubscribe function)
- Actions return `Promise<void>` for async operations
