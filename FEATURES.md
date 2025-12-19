# Bird - Features & Configuration

## Site Isolation

Each site runs in an isolated **Electron session partition**:
- `session.fromPartition('persist:site-name')` = persistent isolated session
- Each site has its own: cookies, localStorage, IndexedDB, cache, credentials
- Ephemeral session option (without `persist:`) for private mode

---

## Configuration Parameters

### Routing / Navigation

| Parameter | Type | Description |
|-----------|------|-------------|
| `baseUrl` | `string` | Base URL of the site |
| `mainUrl` | `string?` | Home URL (for idle return, home button) |
| `internalPatterns` | `string[]?` | Regex patterns for internal URLs (open in Bird) |
| `externalPatterns` | `string[]?` | Regex patterns for external URLs (open in system browser) |
| `newTabPatterns` | `string[]?` | Regex patterns to force new tab |
| `blockPatterns` | `string[]?` | Regex patterns to block completely |
| `allowedDomains` | `string[]?` | Domain whitelist (kiosk mode) |

### Downloads

| Parameter | Type | Description |
|-----------|------|-------------|
| `downloadPath` | `string?` | Download folder (system default or custom) |
| `tempDownloads` | `boolean?` | Temporary downloads (deleted on close) |
| `autoOpenTypes` | `string[]?` | MIME types to auto-open |
| `autoOpenExtensions` | `string[]?` | Extensions to auto-open |
| `autoOpenMaxSize` | `number?` | Max size for auto-open (MB) |
| `askBehavior` | `'always' \| 'never' \| 'largeOnly'?` | When to ask user |

### User Interface

| Parameter | Type | Description |
|-----------|------|-------------|
| `showNavigationBar` | `boolean?` | Show/hide navigation bar |
| `navigationPosition` | `'top' \| 'bottom'?` | Navigation bar position |
| `showBackForward` | `boolean?` | Show back/forward buttons |
| `showReload` | `boolean?` | Show reload button |
| `showUrlBar` | `boolean?` | Show URL bar |
| `urlBarEditable` | `boolean?` | URL bar editable or read-only |
| `showBookmarks` | `boolean?` | Show bookmarks bar |
| `bookmarks` | `Bookmark[]?` | Predefined bookmarks |
| `showTabBar` | `boolean?` | Show tab bar |
| `maxTabs` | `number?` | Max tabs (0 = unlimited) |

### Automatic Behavior

| Parameter | Type | Description |
|-----------|------|-------------|
| `idleTimeout` | `number?` | Seconds before idle action (0 = disabled) |
| `idleAction` | `'returnToMain' \| 'clearSession' \| 'lock' \| 'none'?` | Action on idle |
| `autoRefreshInterval` | `number?` | Auto-refresh interval in seconds (dashboards) |
| `clearDataOnClose` | `boolean?` | Clear session data on close |
| `restoreSession` | `boolean?` | Restore tabs on restart |

### JavaScript Injection

| Parameter | Type | Description |
|-----------|------|-------------|
| `injectScript` | `string?` | Local script path |
| `injectScriptUrl` | `string?` | Remote script URL (fetched on startup) |
| `injectGlobal` | `object?` | Object exposed as `window.__BIRD__` |
| `injectTiming` | `'dom-ready' \| 'did-finish-load'?` | When to inject |
| `injectCss` | `string?` | Custom CSS to inject |
| `injectCssUrl` | `string?` | Remote CSS URL |

### Appearance

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | `'system' \| 'light' \| 'dark'?` | App theme |
| `forceDarkMode` | `boolean?` | Force dark mode on all sites |
| `defaultZoom` | `number?` | Default zoom level (1.0 = 100%) |
| `rememberZoom` | `boolean?` | Remember zoom per site |

### Window

| Parameter | Type | Description |
|-----------|------|-------------|
| `width` | `number?` | Window width |
| `height` | `number?` | Window height |
| `alwaysOnTop` | `boolean?` | Always on top |
| `startFullscreen` | `boolean?` | Start in fullscreen |
| `startMaximized` | `boolean?` | Start maximized |
| `kiosk` | `boolean?` | System kiosk mode (no escape) |
| `rememberBounds` | `boolean?` | Remember window position/size |

### Security & Permissions

| Parameter | Type | Description |
|-----------|------|-------------|
| `allowDevTools` | `boolean?` | Allow DevTools |
| `allowContextMenu` | `boolean?` | Allow right-click menu |
| `allowPopups` | `boolean?` | Allow popups |
| `allowPrint` | `boolean?` | Allow printing |
| `allowScreenshot` | `boolean?` | Allow screenshots |
| `permissions.camera` | `'allow' \| 'deny' \| 'ask'?` | Camera permission |
| `permissions.microphone` | `'allow' \| 'deny' \| 'ask'?` | Microphone permission |
| `permissions.notifications` | `'allow' \| 'deny' \| 'ask'?` | Notifications permission |
| `permissions.geolocation` | `'allow' \| 'deny' \| 'ask'?` | Geolocation permission |
| `permissions.clipboard` | `'allow' \| 'deny' \| 'ask'?` | Clipboard permission |

### Network

| Parameter | Type | Description |
|-----------|------|-------------|
| `userAgent` | `string?` | Custom User-Agent |
| `spoofMobile` | `boolean?` | Spoof mobile User-Agent |
| `proxy` | `string?` | Proxy URL |
| `proxyBypass` | `string[]?` | Domains to bypass proxy |
| `allowInvalidCerts` | `boolean?` | Allow invalid SSL certificates (dev) |

### Extensions

| Parameter | Type | Description |
|-----------|------|-------------|
| `adBlockEnabled` | `boolean?` | Enable ad blocker |
| `adBlockLists` | `string[]?` | Filter lists (easylist, easyprivacy, etc.) |
| `customBlockRules` | `string[]?` | Custom blocking rules |

### System Integration

| Parameter | Type | Description |
|-----------|------|-------------|
| `showTrayIcon` | `boolean?` | Show system tray icon |
| `minimizeToTray` | `boolean?` | Minimize to tray instead of taskbar |
| `trayMenu` | `MenuItem[]?` | Custom tray menu items |
| `enablePiP` | `boolean?` | Enable Picture-in-Picture |

### Paths

| Parameter | Type | Description |
|-----------|------|-------------|
| `configPath` | `string?` | Config folder path |
| `cachePath` | `string?` | Cache folder path |
| `dataPath` | `string?` | User data folder path |
| `useSystemPaths` | `boolean?` | Use XDG/AppData system defaults |

### Shortcuts

| Parameter | Type | Description |
|-----------|------|-------------|
| `shortcuts` | `Record<string, string>?` | Custom keyboard shortcuts |

Default shortcuts:
- `reload`: `F5` / `Ctrl+R`
- `hardReload`: `Ctrl+Shift+R`
- `back`: `Alt+Left`
- `forward`: `Alt+Right`
- `home`: `Alt+Home`
- `focusUrl`: `Ctrl+L`
- `newTab`: `Ctrl+T`
- `closeTab`: `Ctrl+W`
- `devTools`: `F12`
- `fullscreen`: `F11`
- `zoomIn`: `Ctrl++`
- `zoomOut`: `Ctrl+-`
- `zoomReset`: `Ctrl+0`
- `find`: `Ctrl+F`
- `print`: `Ctrl+P`

---

## Execution Modes

### Manager Mode

UI for configuring and launching sites:

```bash
bird                      # Open manager UI
bird --site gmail         # Launch gmail directly
```

Features:
- Configure sites via React UI
- Sites stored in `~/.config/bird/sites/*.json`
- Fetch favicon from target sites
- Create desktop shortcuts (per-site)
- Export config JSON (for bundled mode)

Config structure:
```
~/.config/bird/
├── global.json          # Global defaults (inherited by all sites)
└── sites/
    ├── gmail.json       # SiteConfig for Gmail
    ├── slack.json       # SiteConfig for Slack
    └── youtube.json     # SiteConfig for YouTube
```

Each site file contains a complete `SiteConfig`. Missing values are inherited from `global.json`.

#### Desktop Shortcuts

Manager can create system shortcuts per site:

| Platform | Location | Format |
|----------|----------|--------|
| Linux | `~/.local/share/applications/` | `.desktop` file |
| macOS | `~/Applications/` | `.app` bundle (alias) |
| Windows | Start Menu / Desktop | `.lnk` shortcut |

Shortcuts launch Bird directly with `--site <name>`.

### Bundled Mode

Standalone app with embedded config, built from an exported JSON:

```bash
bird bundle --config ./gmail.json --out ./gmail-app/
```

Build process:
```
src/
└── config/
    └── site.ts          # Hardcoded SiteConfig (injected at build)
```

Or via environment variable:
```bash
BIRD_SITE_CONFIG=./configs/gmail.json pnpm build
```

The resulting app is standalone: no `~/.config/bird/`, starts directly on the configured site. No manager UI included.

---

## Configuration Schema

```typescript
interface SiteConfig {
  // Identity
  name: string
  icon?: string // path or URL

  // Routing
  baseUrl: string
  mainUrl?: string
  internalPatterns?: string[]
  externalPatterns?: string[]
  newTabPatterns?: string[]
  blockPatterns?: string[]
  allowedDomains?: string[]

  // Session
  partition?: string // default: 'persist:{name}'
  clearDataOnClose?: boolean

  // UI
  ui?: {
    showNavigationBar?: boolean
    navigationPosition?: 'top' | 'bottom'
    showBackForward?: boolean
    showReload?: boolean
    showUrlBar?: boolean
    urlBarEditable?: boolean
    showBookmarks?: boolean
    bookmarks?: { name: string; url: string; icon?: string }[]
    showTabBar?: boolean
    maxTabs?: number
  }

  // Downloads
  downloads?: {
    path?: string
    temp?: boolean
    autoOpenTypes?: string[]
    autoOpenExtensions?: string[]
    autoOpenMaxSize?: number
    askBehavior?: 'always' | 'never' | 'largeOnly'
  }

  // Behavior
  behavior?: {
    idleTimeout?: number
    idleAction?: 'returnToMain' | 'clearSession' | 'lock' | 'none'
    autoRefreshInterval?: number
    restoreSession?: boolean
  }

  // Injection
  inject?: {
    script?: string
    scriptUrl?: string
    global?: Record<string, unknown>
    css?: string
    cssUrl?: string
    timing?: 'dom-ready' | 'did-finish-load'
  }

  // Appearance
  appearance?: {
    theme?: 'system' | 'light' | 'dark'
    forceDarkMode?: boolean
    defaultZoom?: number
    rememberZoom?: boolean
  }

  // Window
  window?: {
    width?: number
    height?: number
    alwaysOnTop?: boolean
    fullscreen?: boolean
    maximized?: boolean
    kiosk?: boolean
    rememberBounds?: boolean
  }

  // Security
  security?: {
    allowDevTools?: boolean
    allowContextMenu?: boolean
    allowPopups?: boolean
    allowPrint?: boolean
    allowScreenshot?: boolean
    permissions?: {
      camera?: 'allow' | 'deny' | 'ask'
      microphone?: 'allow' | 'deny' | 'ask'
      notifications?: 'allow' | 'deny' | 'ask'
      geolocation?: 'allow' | 'deny' | 'ask'
      clipboard?: 'allow' | 'deny' | 'ask'
    }
  }

  // Network
  network?: {
    userAgent?: string
    spoofMobile?: boolean
    proxy?: string
    proxyBypass?: string[]
    allowInvalidCerts?: boolean
  }

  // Extensions
  extensions?: {
    adBlock?: boolean
    adBlockLists?: string[]
    customBlockRules?: string[]
  }

  // System
  system?: {
    showTrayIcon?: boolean
    minimizeToTray?: boolean
    enablePiP?: boolean
  }

  // Paths
  paths?: {
    config?: string
    cache?: string
    data?: string
    downloads?: string
    useSystemPaths?: boolean
  }

  // Shortcuts
  shortcuts?: Record<string, string>
}
```

---

## Features by Use Case

### 1. Packaged Distribution

Pre-configured single-app builds:
- Hardcoded `SiteConfig` at build time
- Minimal/no user configuration
- Custom app name, icon, window settings
- Optional kiosk mode

### 2. Multi-site Manager

User-facing site manager:
- Sites stored in JSON config file
- Each site in isolated session partition
- Icon fetching from target sites
- `.desktop` file generation (Linux)
- Profile import/export

### 3. Browser Mode

Full-featured minimalist browser:
- Navigation bar (back, forward, reload, URL bar)
- Tab management
- Bookmarks
- History
- Search engine integration
- All permissions configurable

### 4. Kiosk Mode

Restrictive browser for controlled environments:
- Locked to specific URL patterns
- No navigation UI (or limited)
- Prevents escape to external sites
- Auto-return to main URL on idle
- Optional session clearing
- System kiosk mode (no Alt+F4, etc.)

---

## Implementation Priority

### Essential (to do first)

| Feature | Parameters | Use case |
|---------|------------|----------|
| User-Agent custom | `userAgent`, `spoofMobile` | Sites blocking Electron, mobile testing |
| Persistent zoom | `defaultZoom`, `rememberZoomPerSite` | Reading comfort |
| Keyboard shortcuts | `shortcuts: { reload: 'F5', ... }` | Customization, kiosk mode |
| Window options | `alwaysOnTop`, `startFullscreen`, `startMaximized`, `rememberBounds` | Kiosk, dashboard |
| Tray icon | `showTrayIcon`, `minimizeToTray`, `trayMenu` | Persistent apps |
| Permissions | `permissions: { camera, mic, notifications, geolocation, clipboard }` | Granular security |

### Useful (medium priority)

| Feature | Parameters | Use case |
|---------|------------|----------|
| Proxy | `proxyUrl`, `proxyBypass` | Enterprise, VPN |
| Certificates | `allowInvalidCerts`, `clientCertPath` | Dev, intranet |
| Audio | `muteByDefault`, `autoplayPolicy` | Comfort |
| Picture-in-Picture | `enablePiP` | YouTube, Twitch, video calls |
| Offline page | `offlinePage`, `cacheForOffline` | Resilience |
| Print | `allowPrint`, `printSilent` | Kiosk, tickets |
| Screenshot | `allowScreenshot`, `screenshotPath`, shortcut | Documentation |

### Nice-to-have (later)

| Feature | Parameters | Use case |
|---------|------------|----------|
| History | `enableHistory`, `historyRetention` | Browser mode |
| Find in page | Native Ctrl+F | Browser mode |
| Search engine | `searchEngine`, `searchUrl` | Browser mode, URL bar |
| Reader mode | `readerMode` | Articles |
| Profiles | Import/export JSON | Multi-site manager |
| Fake geolocation | `geolocationOverride: {lat, lon}` | Testing, privacy |
| Loading notifications | `showLoadingProgress` | Visual feedback |

### Ideas (not planned yet)

| Feature | Parameters | Use case |
|---------|------------|----------|
| Client certificate | `clientCertPath` | mTLS authentication |
| Media session | `mediaSessionEnabled` | System media controls integration |
| Spell check | `spellCheckEnabled`, `spellCheckLanguages` | Form input |
| Auto-fill | `autoFillEnabled` | Forms (basic, no password) |
| Tab pinning | `pinnedTabs` | Persistent tabs |
| Tab grouping | `tabGroups` | Organization |
| Sidebar | `sidebarEnabled`, `sidebarPosition` | Quick access bookmarks |
| Split view | `splitViewEnabled` | Two sites side by side |
| Session export | `exportSessionAs` | Debug, backup |
| Startup script | `onStartup` | Automation |
| Wake lock | `preventSleep` | Kiosk, dashboards |
| Touch gestures | `touchGesturesEnabled` | Tablet/touch kiosk |
| Screen lock | `lockScreenAfterIdle`, `lockPin` | Kiosk security |

---

## Out of Scope

Features intentionally not included to keep the project lightweight:

- Password manager (use system keychain)
- Cloud sync
- Full WebExtension support
- Built-in VPN
- Automatic translation
- Complex theming engine
