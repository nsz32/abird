# Architecture

## Overview

Bird is an Electron app that wraps web applications as isolated desktop apps. Each website runs in its own `WebContentsView` with configurable behavior.

## Directory Structure

```
src/
├── main/                          # Electron main process (40 files)
│   ├── config/                    # Configuration management (3 files)
│   │   ├── store.ts               # JSON file I/O, validation (Zod), memory cache
│   │   ├── resolver.ts            # Config merging: defaults → global → app → EffectiveConfig
│   │   └── index.ts               # Public API exports
│   ├── core/                      # Application core (11 files)
│   │   ├── App.ts                 # Bootstrap, view creation, subscriptions setup
│   │   ├── MainWindow.ts          # Main Electron window (BaseWindow wrapper)
│   │   ├── ViewManager.ts         # Z-ordering manager (detach/reattach pattern)
│   │   ├── View.ts                # Abstract base class for all views
│   │   ├── states.ts              # **Single source of truth** - all observables
│   │   ├── UrlRouter.ts           # URL action resolver (internal/external/download/ignore)
│   │   ├── Protocol.ts            # bird:// protocol handler (privileged scheme)
│   │   ├── I18n.ts                # Internationalization (system language detection)
│   │   ├── cli.ts                 # CLI arguments parsing (app/browser/config modes)
│   │   ├── kiosk.ts               # Kiosk mode with custom escape shortcut
│   │   └── index.ts               # Main entry point
│   ├── tabs/                      # Tab management (2 files)
│   │   ├── Tabs.ts                # Global tabs manager (create, close, activate)
│   │   └── Tab.ts                 # Individual tab class, nav state, deferred validation
│   ├── views/                     # UI views (9 files)
│   │   ├── BrowserView.ts         # Abstract navigable content (navigation, find-in-page)
│   │   ├── WebView.ts             # External HTTP/HTTPS content (no preload, sandboxed)
│   │   ├── PanelView.ts           # Internal bird:// URLs (with preload, trusted)
│   │   ├── NavBar.ts              # Navigation bar React overlay
│   │   ├── FindBar.ts             # Find-in-page overlay
│   │   ├── NotificationCenter.ts  # Notifications overlay
│   │   ├── Watermark.ts           # Background watermark
│   │   ├── OverlayPanel.ts        # Generic panel (used for downloads)
│   │   └── views.ts               # Global view registry (singleton pattern)
│   ├── services/                  # Business services (7 files)
│   │   ├── DownloadManager.ts     # Downloads tracking, history, retry, auto-open
│   │   ├── PartitionManager.ts    # Partition CRUD, cache cleanup, locks
│   │   ├── CacheManager.ts        # Automatic cache cleanup (by size/age)
│   │   ├── AdBlocker.ts           # Ghostery adblocker integration
│   │   ├── deploy.ts              # Desktop shortcut deployment (.desktop Linux)
│   │   ├── icons.ts               # Icon fetching, storage, import
│   │   └── notify.ts              # Notification system (with auto-dismiss)
│   ├── input/                     # Input handling (2 files)
│   │   ├── inputListener.ts       # Global keyboard listener (uiohook-napi)
│   │   └── menu.ts                # Native application menu
│   ├── utils/                     # Main process utilities (6 files)
│   │   ├── observable.ts          # **Core pattern**: StateObservable, BroadcastObservable
│   │   ├── userAgents.ts          # User-agent resolution (desktop:chrome, mobile:android)
│   │   ├── platform.ts            # Platform detection, file opening
│   │   ├── parseSize.ts           # Human-readable size parsing (10MB → bytes)
│   │   ├── executableDetection.ts # Dangerous file detection
│   │   └── fileDetection.ts       # File type detection
│   └── handlers.ts                # All IPC handlers registration
├── preload/                       # Context bridge (1 file)
│   └── index.ts                   # window.bird API exposure (11 namespaces)
├── shared/                        # Shared code (5 files)
│   ├── config.schema.ts           # **Zod schemas** (source of truth for types)
│   ├── types.ts                   # TypeScript types (NavigationState, TabInfo, IpcChannels, BirdApi)
│   ├── routing.ts                 # URL routing utilities (pattern derivation)
│   ├── partition.ts               # Partition name validation (lowercase + underscore)
│   └── i18n/
│       └── translations.ts        # Translation files (EN/FR)
└── ui/                            # React overlays (32 files)
    ├── shared/                    # Shared UI code (3 files)
    │   └── hooks/
    │       ├── useBirdState.ts    # **Universal hook** for main → renderer sync
    │       ├── useTranslations.ts # i18n hook with singleton cache
    │       └── index.ts
    ├── config/                    # Configuration app (26 files)
    │   ├── App.tsx                # Root component + router + state management
    │   ├── useHashRouter.ts       # Client-side hash-based router
    │   ├── pages/                 # Main pages (3 files)
    │   │   ├── HomePage.tsx       # Dashboard + global config
    │   │   ├── AppPage.tsx        # Per-app configuration
    │   │   └── PartitionPage.tsx  # Partition management
    │   ├── components/            # Reusable components (18 files)
    │   │   ├── AppList.tsx        # App list with cards
    │   │   ├── AppCard.tsx        # Individual app card (shows partition)
    │   │   ├── PartitionList.tsx  # Partition list
    │   │   ├── PartitionCard.tsx  # Individual partition card
    │   │   ├── CreateAppDialog.tsx
    │   │   ├── EditStartUrlDialog.tsx
    │   │   ├── RenameDialog.tsx
    │   │   ├── IconPickerDialog.tsx
    │   │   ├── SwitchField.tsx
    │   │   ├── NumberField.tsx
    │   │   ├── SegmentSelect.tsx
    │   │   ├── TriStateSegmentSelect.tsx
    │   │   ├── PartitionSelect.tsx
    │   │   ├── RoutingRulesEditor.tsx
    │   │   ├── NavBarConfigForm.tsx
    │   │   ├── PageHeader.tsx
    │   │   ├── ConfigSection.tsx
    │   │   └── ErrorBoundary.tsx
    │   ├── hooks/                 # Config-specific hooks (4 files)
    │   │   ├── useAppDeploy.ts    # Desktop shortcut deployment state
    │   │   ├── useAppIcon.ts      # Icon loading with dimensions
    │   │   ├── useAutoRedeploy.ts # Auto-redeploy on icon change
    │   │   └── useLaunchSupport.ts # Platform capability checking
    │   └── utils/                 # Config utilities (3 files)
    │       ├── partitions.ts      # Partition derivation, usage maps, validation
    │       ├── format.ts          # Display formatting (bytes, dates)
    │       └── nameValidation.ts  # Cross-platform folder name validation
    ├── navbar/                    # Navigation bar overlay (5 files)
    │   ├── App.tsx
    │   ├── TabButton.tsx
    │   ├── DownloadProgressIcon.tsx
    │   ├── useNavbarState.ts
    │   └── main.tsx
    ├── downloads/                 # Downloads panel overlay (2 files)
    │   ├── App.tsx
    │   └── main.tsx
    ├── findbar/                   # Find-in-page overlay (2 files)
    │   ├── App.tsx
    │   └── main.tsx
    ├── notifications/             # Notifications overlay (2 files)
    │   ├── App.tsx
    │   └── main.tsx
    └── watermark/                 # Watermark overlay (minimal)
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
├── ViewManager (z-ordering via detach/reattach pattern)
│   ├── Watermark (z=0)
│   ├── Content views (z=10)
│   │   ├── WebView (external HTTP/HTTPS tabs, no preload)
│   │   └── PanelView (internal bird:// pages, with preload)
│   ├── NavBar (z=100)
│   ├── FindBar (z=101)
│   └── NotificationCenter (z=102)
```

**Note on z-ordering**: Electron's native z-index is unreliable, so ViewManager uses a detach/reattach pattern to maintain proper layering.

### Configuration Layers

```
Zod Schema Defaults
       ↓
BirdConfig.defaults (global defaults)
       ↓
BirdConfig.global (global user prefs)
       ↓
BirdConfig.apps[appId] (per-app overrides)
       ↓
EffectiveConfig (computed, emitted to config$)
```

**Important**: Types are inferred from Zod schemas (`z.infer<typeof schema>`), ensuring validation and types are always in sync.

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

### Tab Management

Bird tracks two separate concepts:
- **activeTabId$**: The selected tab (persists even when a panel is active)
- **activeContentId$**: The currently visible view (tab id or "downloads")

**Tab Validation**: Tabs created via `target="_blank"` undergo deferred validation:
1. Created with `hasVisibleContent()` check scheduled
2. If validation fails (empty/invalid content), tab auto-closes
3. Valid tabs persist and can track parent for "back to parent" navigation

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

- **Main → Renderer**: `BroadcastObservable` auto-sends to registered WebContents, or direct `webContents.send()`
- **Renderer → Main**: `ipcRenderer.invoke()` via preload bridge
- **Channels**: Defined in `shared/types.ts` (`IpcChannels`), follow pattern `bird:module:action`

### API Surface (`window.bird`)

The preload bridge exposes a type-safe API (11 namespaces):
```typescript
window.bird = {
  navigation,      // Navigation controls (go, back, forward, reload, stop)
  tabs,            // Tab management (list, create, close, activate)
  config,          // Get effective config (reactive)
  navbar,          // Navbar resize, state sync
  notifications,   // Notification center (show, dismiss)
  downloads,       // Downloads management (list, pause, resume, cancel, open)
  find,            // Find in page (start, next, previous, stop)
  keyboard,        // Keyboard state (isTyping)
  settings,        // Read/write user config (userconfig, cliargs, version)
  i18n,            // Translations (get, list, onChanged)
  icons,           // Icon fetching and storage (fetch, get, getAll, pick, import)
  deploy,          // Desktop shortcut deployment (deploy, undeploy, getStatus)
  partition,       // Partition management (list, cleanup, reset, delete, rename)
  app,             // App launching (launch, canLaunch)
}
```

Each namespace follows consistent patterns:
- `get*()` / `list()` — Fetch current state
- `on*Changed()` — Subscribe to updates (returns unsubscribe function)
- Actions return `Promise<void>` for async operations

## Core Architectural Principles

### Single Source of Truth

- **`shared/config.schema.ts`**: All config types inferred from Zod schemas (validation = types)
- **`main/core/states.ts`**: All observables centralized in one file
- **Main process**: Source of truth for config, state, navigation

### Security Model

- **Partition isolation**: Each app runs in separate Electron session (strict isolation)
- **Selective preload**:
  - `WebView` (external sites): NO preload, full sandbox
  - `PanelView` (bird:// internal): WITH preload, trusted context bridge
- **Sandbox everywhere**: All views have `sandbox: true`, `contextIsolation: true`
- **Protocol privileges**: `bird://` registered as privileged scheme

### Performance

- **Deferred tab validation**: Prevents empty tabs from `target="_blank"` links
- **ViewManager detach/reattach**: Workaround for Electron's unreliable z-index
- **Combined observables**: Reactive recomputation only when dependencies change
- **BroadcastObservable**: Efficient state sync to multiple WebContents

### Code Organization

- **Naming conventions**:
  - Observables: suffix `$` (e.g., `config$`, `tabs$`)
  - Handlers: prefix `handle` (e.g., `handleNavigation`)
  - Callbacks: prefix `on` (e.g., `onNavStateChanged`)
- **Imports**: Grouped and sorted by Biome (external → internal → relative)
- **No external observable libs**: Custom implementation to avoid dependencies
