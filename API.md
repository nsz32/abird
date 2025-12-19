# Bird - Internal API & Script Injection

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ Main Process                                    │
│   └── Internal API (modular)                    │
│         ↑↓ IPC                                  │
├─────────────────────────────────────────────────┤
│ Injected Script (isolated, privileged context)  │
│   - Full access to Bird API                     │
│   - Can expose window.__BIRD__ to site          │
│   - Can manipulate DOM                          │
│   - Can intercept/modify behaviors              │
├─────────────────────────────────────────────────┤
│ Website (unprivileged context)                  │
│   - Only sees what the script exposes           │
└─────────────────────────────────────────────────┘
```

The injected script acts as **middleware** between Bird and the website. It decides:
- What to expose to the site (`window.__BIRD__`)
- What to do itself (automation, custom UI, hooks)
- What to intercept (navigation, events, requests)

---

## Internal API Modules

### Navigation

```typescript
bird.navigation.go(url: string)
bird.navigation.back()
bird.navigation.forward()
bird.navigation.reload(hard?: boolean)
bird.navigation.stop()
bird.navigation.getUrl(): string
bird.navigation.getTitle(): string
bird.navigation.canGoBack(): boolean
bird.navigation.canGoForward(): boolean
```

### Tabs

```typescript
bird.tabs.create(url: string, options?: TabOptions): Tab
bird.tabs.close(id: string)
bird.tabs.get(id: string): Tab
bird.tabs.getAll(): Tab[]
bird.tabs.getActive(): Tab
bird.tabs.setActive(id: string)
bird.tabs.move(id: string, index: number)
bird.tabs.reload(id: string, hard?: boolean)
```

### Window

```typescript
bird.window.minimize()
bird.window.maximize()
bird.window.restore()
bird.window.close()
bird.window.setFullscreen(enabled: boolean)
bird.window.isFullscreen(): boolean
bird.window.setAlwaysOnTop(enabled: boolean)
bird.window.setBounds(bounds: Partial<Rectangle>)
bird.window.getBounds(): Rectangle
bird.window.focus()
bird.window.blur()
```

### Config

```typescript
bird.config.get(): SiteConfig
bird.config.get<T>(path: string): T
bird.config.set(path: string, value: unknown)
bird.config.set(partial: Partial<SiteConfig>)
bird.config.reset(path?: string)
bird.config.onChange(callback: (config: SiteConfig) => void)
```

### Downloads

```typescript
bird.downloads.start(url: string, options?: DownloadOptions): Download
bird.downloads.cancel(id: string)
bird.downloads.pause(id: string)
bird.downloads.resume(id: string)
bird.downloads.getAll(): Download[]
bird.downloads.get(id: string): Download
bird.downloads.open(id: string)
bird.downloads.showInFolder(id: string)
bird.downloads.clearHistory()
```

### Overlay

```typescript
bird.overlay.show(name: string)
bird.overlay.hide(name: string)
bird.overlay.toggle(name: string)
bird.overlay.isVisible(name: string): boolean
bird.overlay.setBounds(name: string, bounds: OverlayBounds)
bird.overlay.send(name: string, channel: string, data: unknown)
```

### UI

```typescript
bird.ui.showNotification(options: NotificationOptions)
bird.ui.showDialog(options: DialogOptions): Promise<DialogResult>
bird.ui.showContextMenu(items: MenuItem[])
bird.ui.setProgress(progress: number) // taskbar progress
bird.ui.setBadge(text: string) // dock badge
bird.ui.setTitle(title: string)
```

### Clipboard

```typescript
bird.clipboard.readText(): string
bird.clipboard.writeText(text: string)
bird.clipboard.readImage(): NativeImage
bird.clipboard.writeImage(image: NativeImage)
bird.clipboard.clear()
```

### Shell

```typescript
bird.shell.openExternal(url: string)
bird.shell.openPath(path: string)
bird.shell.showItemInFolder(path: string)
bird.shell.beep()
```

### System

```typescript
bird.system.getPlatform(): 'linux' | 'darwin' | 'win32'
bird.system.getVersion(): string
bird.system.getLocale(): string
bird.system.isOnline(): boolean
bird.system.getIdleTime(): number
bird.system.getMemoryUsage(): MemoryInfo
```

### Storage

```typescript
bird.storage.get(key: string): unknown
bird.storage.set(key: string, value: unknown)
bird.storage.remove(key: string)
bird.storage.clear()
bird.storage.keys(): string[]
```

### Session

```typescript
bird.session.clearCache()
bird.session.clearStorageData(options?: ClearStorageOptions)
bird.session.getCookies(filter?: CookieFilter): Cookie[]
bird.session.setCookie(cookie: Cookie)
bird.session.removeCookie(url: string, name: string)
bird.session.setUserAgent(userAgent: string)
bird.session.getUserAgent(): string
```

---

## Events

All modules emit events that can be listened to:

```typescript
bird.on(event: string, callback: Function)
bird.once(event: string, callback: Function)
bird.off(event: string, callback: Function)
```

### Navigation Events

| Event | Payload | Description |
|-------|---------|-------------|
| `navigation:will-navigate` | `{ url, isInternalUrl }` | Before navigation (cancelable) |
| `navigation:did-navigate` | `{ url, isInternalUrl }` | After navigation |
| `navigation:did-start-loading` | `{}` | Page started loading |
| `navigation:did-stop-loading` | `{}` | Page finished loading |
| `navigation:dom-ready` | `{}` | DOM is ready |
| `navigation:page-title-updated` | `{ title }` | Page title changed |
| `navigation:page-favicon-updated` | `{ favicons }` | Favicon changed |

### Tab Events

| Event | Payload | Description |
|-------|---------|-------------|
| `tabs:created` | `{ tab }` | Tab created |
| `tabs:closed` | `{ id }` | Tab closed |
| `tabs:activated` | `{ id, previousId }` | Active tab changed |
| `tabs:updated` | `{ id, changes }` | Tab properties changed |

### Download Events

| Event | Payload | Description |
|-------|---------|-------------|
| `downloads:started` | `{ download }` | Download started |
| `downloads:progress` | `{ id, progress, speed }` | Download progress |
| `downloads:completed` | `{ id, path }` | Download completed |
| `downloads:failed` | `{ id, error }` | Download failed |
| `downloads:cancelled` | `{ id }` | Download cancelled |

### Window Events

| Event | Payload | Description |
|-------|---------|-------------|
| `window:focus` | `{}` | Window focused |
| `window:blur` | `{}` | Window blurred |
| `window:resize` | `{ width, height }` | Window resized |
| `window:move` | `{ x, y }` | Window moved |
| `window:minimize` | `{}` | Window minimized |
| `window:maximize` | `{}` | Window maximized |
| `window:restore` | `{}` | Window restored |
| `window:enter-fullscreen` | `{}` | Entered fullscreen |
| `window:leave-fullscreen` | `{}` | Left fullscreen |
| `window:close` | `{}` | Window closing (cancelable) |

### System Events

| Event | Payload | Description |
|-------|---------|-------------|
| `system:idle` | `{ idleTime }` | User idle detected |
| `system:active` | `{}` | User active again |
| `system:online` | `{}` | Network online |
| `system:offline` | `{}` | Network offline |
| `system:suspend` | `{}` | System suspending |
| `system:resume` | `{}` | System resumed |

### Config Events

| Event | Payload | Description |
|-------|---------|-------------|
| `config:changed` | `{ path, oldValue, newValue }` | Config changed |

---

## Cancelable Events

Some events can be canceled to prevent default behavior:

```typescript
bird.on('navigation:will-navigate', (event) => {
  if (event.url.includes('ads')) {
    event.preventDefault() // Block navigation
  }
})

bird.on('window:close', (event) => {
  event.preventDefault() // Prevent closing
  bird.ui.showDialog({
    message: 'Are you sure?',
    buttons: ['Yes', 'No']
  }).then(result => {
    if (result.index === 0) {
      bird.window.close({ force: true })
    }
  })
})
```

---

## Injected Script Examples

### Expose minimal API to site

```javascript
// injected.js
window.__BIRD__ = {
  version: bird.system.getVersion(),
  navigate: (url) => bird.navigation.go(url),
  isOnline: () => bird.system.isOnline(),
}
```

### Auto-login

```javascript
// injected.js
bird.on('navigation:dom-ready', () => {
  const loginForm = document.querySelector('#login-form')
  if (loginForm) {
    document.querySelector('#username').value = bird.config.get('credentials.username')
    document.querySelector('#password').value = bird.config.get('credentials.password')
    loginForm.submit()
  }
})
```

### Block ads via navigation

```javascript
// injected.js
const adPatterns = [/ads\./, /tracking\./, /analytics\./]

bird.on('navigation:will-navigate', (event) => {
  if (adPatterns.some(p => p.test(event.url))) {
    event.preventDefault()
  }
})
```

### Custom idle behavior

```javascript
// injected.js
bird.on('system:idle', (event) => {
  if (event.idleTime > 300) { // 5 minutes
    bird.navigation.go(bird.config.get('mainUrl'))
    bird.session.clearStorageData({ storages: ['cookies'] })
  }
})
```

### Inject custom CSS

```javascript
// injected.js
const style = document.createElement('style')
style.textContent = `
  .ads, .banner, .popup { display: none !important; }
  body { font-family: 'Comic Sans MS' !important; }
`
document.head.appendChild(style)
```

### Notify on download complete

```javascript
// injected.js
bird.on('downloads:completed', ({ id, path }) => {
  bird.ui.showNotification({
    title: 'Download complete',
    body: path,
    onClick: () => bird.shell.showItemInFolder(path)
  })
})
```

### Site-aware context menu

```javascript
// injected.js
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()

  const items = [
    { label: 'Back', click: () => bird.navigation.back() },
    { label: 'Forward', click: () => bird.navigation.forward() },
    { type: 'separator' },
    { label: 'Reload', click: () => bird.navigation.reload() },
  ]

  if (e.target.tagName === 'IMG') {
    items.push({ type: 'separator' })
    items.push({ label: 'Save image', click: () => bird.downloads.start(e.target.src) })
  }

  bird.ui.showContextMenu(items)
})
```

---

## Security Considerations

The injected script has **full access** to Bird's API. This is intentional for maximum flexibility, but:

- Only inject scripts you trust
- `injectScriptUrl` fetches remote code - use HTTPS and trusted sources
- The site itself (unprivileged context) only sees what you expose via `window.__BIRD__`
- Consider exposing a minimal API to the site, keep powerful features in the injected script

---

## Implementation Notes

### Main Process

Each API module should:
- Be a separate file in `src/main/api/`
- Export typed functions
- Register IPC handlers
- Emit events via central event bus

```typescript
// src/main/api/navigation.ts
export const navigation = {
  go(url: string) { /* ... */ },
  back() { /* ... */ },
  // ...
}

// Register IPC
ipcMain.handle('bird:navigation:go', (_, url) => navigation.go(url))
ipcMain.handle('bird:navigation:back', () => navigation.back())
```

### Preload

Expose API to injected script context:

```typescript
// src/preload/api.ts
contextBridge.exposeInMainWorld('bird', {
  navigation: {
    go: (url) => ipcRenderer.invoke('bird:navigation:go', url),
    back: () => ipcRenderer.invoke('bird:navigation:back'),
    // ...
  },
  on: (event, callback) => ipcRenderer.on(`bird:${event}`, callback),
  // ...
})
```

### Script Injection

Inject script at `dom-ready`:

```typescript
siteView.webContents.on('dom-ready', async () => {
  if (config.inject?.script) {
    const code = await fs.readFile(config.inject.script, 'utf-8')
    siteView.webContents.executeJavaScript(code)
  }
  if (config.inject?.scriptUrl) {
    const code = await fetch(config.inject.scriptUrl).then(r => r.text())
    siteView.webContents.executeJavaScript(code)
  }
})
```
