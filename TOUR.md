# Tour du code Bird

## Architecture globale

Bird utilise l'architecture Electron moderne avec **3 processus isolés** :

```
┌─────────────────┐     IPC      ┌─────────────┐    contextBridge    ┌──────────────┐
│  Main Process   │◄────────────►│   Preload   │◄──────────────────►│   Renderer   │
│  (Node.js)      │              │  (Bridge)   │                     │   (React)    │
└─────────────────┘              └─────────────┘                     └──────────────┘
```

- **Main** : Accès complet à Node.js et Electron
- **Preload** : Script exécuté avant le renderer, pont sécurisé
- **Renderer** : Contexte web isolé (React), n'a accès qu'à ce que le preload expose

---

## 1. Configuration - `electron.vite.config.ts`

Configure 3 builds séparés :

```typescript
const sharedAlias = {
  "@shared": resolve(__dirname, "src/shared"),  // Alias pour imports cross-process
}

export default defineConfig({
  main: { ... },      // → out/main/index.js
  preload: {
    build: {
      lib: { formats: ["cjs"] },  // IMPORTANT: CommonJS obligatoire pour sandbox Electron
    }
  },                  // → out/preload/index.js
  renderer: {
    root: "src/overlays",  // Chaque overlay = un entry point séparé
  },                  // → out/overlays/navigation/index.html
})
```

**Point clé** : Le preload DOIT être en CommonJS (`formats: ["cjs"]`), sinon Electron sandbox refuse de le charger.

---

## 2. Types partagés - `src/shared/types.ts`

Fichier central importé par les 3 processus :

```typescript
// Données échangées via IPC
export interface NavigationState {
  url: string
  title: string
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
}

// Constantes IPC - évite les typos, autocomplétion
export const IpcChannels = {
  NAVIGATION_BACK: "bird:navigation:back",
  NAVIGATION_STATE_CHANGED: "bird:navigation:state-changed",
  // ...
} as const

// Type de l'API exposée aux overlays
export interface BirdApi {
  navigation: {
    back: () => Promise<void>
    onStateChanged: (callback: (state: NavigationState) => void) => () => void
    // ...
  }
}

// Magie TypeScript : déclare window.bird globalement
declare global {
  interface Window {
    bird: BirdApi
  }
}
```

**Points clés** :
- `as const` sur `IpcChannels` → types littéraux, pas juste `string`
- `declare global` → TypeScript sait que `window.bird` existe dans les overlays

---

## 3. Main Process - Point d'entrée - `src/main/index.ts`

```typescript
app.whenReady().then(() => {
  registerNavigationHandlers()  // 1. Enregistre les handlers IPC AVANT tout
  createWindow()                 // 2. Crée la fenêtre et les vues
  setupNavigationStateSync()     // 3. Écoute les events de navigation APRÈS (car besoin de siteView)
})
```

**L'ordre est important** : handlers IPC → window → sync (car sync a besoin de `siteView` qui est créé dans `createWindow`)

---

## 4. Main Process - Window - `src/main/window.ts`

Gère la fenêtre et les vues. Utilise `BaseWindow` + `WebContentsView` (moderne) au lieu de `BrowserWindow` (legacy).

```typescript
let mainWindow: BaseWindow | null = null
let siteView: WebContentsView | null = null

// Registry des overlays avec leurs bounds
const overlays: Map<string, { view: WebContentsView; bounds: OverlayBounds }> = new Map()
```

### Création d'overlay

```typescript
function createOverlay(name: string, bounds: OverlayBounds): WebContentsView {
  const view = new WebContentsView({
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),  // Injecte le preload
      nodeIntegration: false,   // SÉCURITÉ: pas d'accès Node
      contextIsolation: true,   // SÉCURITÉ: contextes séparés
    },
  })
  view.setBackgroundColor("#00000000")  // Transparent
  overlays.set(name, { view, bounds })
  return view
}
```

### Empilement des vues

```typescript
// L'ordre d'ajout détermine le z-index
mainWindow.contentView.addChildView(siteView)           // En dessous
mainWindow.contentView.addChildView(navigationOverlay)  // Au dessus
```

### Fix du flash blanc au démarrage

```typescript
siteView.setVisible(false)
siteView.webContents.once("dom-ready", () => {
  updateBounds()
  siteView?.setVisible(true)  // Affiche seulement quand prêt
})
```

### Getters exportés

Pour accès depuis d'autres modules :

```typescript
export function getSiteView(): WebContentsView | null { return siteView }
export function getOverlay(name: string): WebContentsView | null { ... }
```

---

## 5. Main Process - API Navigation - `src/main/api/navigation.ts`

Module API avec 3 responsabilités :

### A) Fonctions métier

```typescript
export function getNavigationState(): NavigationState {
  const siteView = getSiteView()
  return {
    url: siteView.webContents.getURL(),
    canGoBack: siteView.webContents.canGoBack(),
    // ...
  }
}

export function goBack(): void {
  const siteView = getSiteView()
  if (siteView?.webContents.canGoBack()) {
    siteView.webContents.goBack()
  }
}
```

### B) Handlers IPC

Appelés par le preload :

```typescript
export function registerNavigationHandlers(): void {
  ipcMain.handle(IpcChannels.NAVIGATION_GET_STATE, () => getNavigationState())
  ipcMain.handle(IpcChannels.NAVIGATION_BACK, () => goBack())
  // ...
}
```

`ipcMain.handle` → répond à `ipcRenderer.invoke` (request/response)

### C) Push d'état

Main → overlay :

```typescript
function pushNavigationState(): void {
  const navigationOverlay = getOverlay("navigation")
  navigationOverlay.webContents.send(IpcChannels.NAVIGATION_STATE_CHANGED, getNavigationState())
}

export function setupNavigationStateSync(): void {
  const webContents = getSiteView().webContents

  // Écoute TOUS les événements qui peuvent changer l'état
  webContents.on("did-navigate", pushNavigationState)
  webContents.on("did-navigate-in-page", pushNavigationState)
  webContents.on("did-start-loading", pushNavigationState)
  webContents.on("did-stop-loading", pushNavigationState)
  // ...
}
```

`webContents.send` → envoie vers `ipcRenderer.on` (push, pas de réponse attendue)

---

## 6. Preload - `src/preload/index.ts`

Pont sécurisé entre main et renderer :

```typescript
contextBridge.exposeInMainWorld("bird", {
  navigation: {
    // Actions → invoke = request/response
    back: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_BACK),
    getState: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_GET_STATE),

    // Écoute d'événements → on = push du main
    onStateChanged: (callback) => {
      const listener = (_event, state) => callback(state)
      ipcRenderer.on(IpcChannels.NAVIGATION_STATE_CHANGED, listener)
      return () => ipcRenderer.removeListener(...)  // Retourne fonction de cleanup
    },
  },
})
```

**Points clés** :
- `contextBridge.exposeInMainWorld("bird", ...)` → crée `window.bird` dans le renderer
- `invoke` = async request/response (retourne Promise)
- `on` = écoute d'événements push
- Pattern de cleanup : `onStateChanged` retourne une fonction pour se désabonner

---

## 7. Renderer/Overlay - `src/overlays/navigation/App.tsx`

Composant React qui consomme l'API :

```typescript
export function App() {
  const [state, setState] = useState<NavigationState>({
    url: "", canGoBack: false, canGoForward: false, isLoading: false, title: ""
  })

  useEffect(() => {
    // 1. Récupère l'état initial
    window.bird.navigation.getState().then(setState)

    // 2. S'abonne aux changements (push du main)
    const unsubscribe = window.bird.navigation.onStateChanged(setState)

    // 3. Cleanup à la destruction du composant
    return unsubscribe
  }, [])

  return (
    <div className="navigation-bar">
      <NavButton onClick={() => window.bird.navigation.back()} disabled={!state.canGoBack}>
        ←
      </NavButton>
      {/* ... */}
      <span className="url-display">{state.url}</span>
    </div>
  )
}
```

**Pattern React standard** :
- `useState` pour l'état local
- `useEffect` pour les effets (fetch initial + subscription)
- Cleanup du listener via return dans useEffect

---

## Flux de données complet

### Action utilisateur (overlay → main)

```
Click "←" → window.bird.navigation.back()
         → ipcRenderer.invoke("bird:navigation:back")
         → ipcMain.handle("bird:navigation:back")
         → goBack()
         → siteView.webContents.goBack()
```

### Push d'état (main → overlay)

```
siteView navigue → event "did-navigate"
                → pushNavigationState()
                → navigationOverlay.webContents.send("bird:navigation:state-changed", state)
                → ipcRenderer.on callback
                → setState(state)
                → React re-render
```

---

## Résumé de la structure

```
src/
├── shared/
│   └── types.ts          # Types + IPC channels + BirdApi + declare global
├── main/
│   ├── index.ts          # Lifecycle app, ordonne les initialisations
│   ├── window.ts         # BaseWindow + WebContentsView + overlays registry
│   └── api/
│       └── navigation.ts # Fonctions + handlers IPC + sync d'état
├── preload/
│   └── index.ts          # contextBridge expose window.bird
└── overlays/
    └── navigation/
        ├── App.tsx       # Composant React avec useEffect pour l'API
        ├── main.tsx      # Point d'entrée React
        ├── styles.css    # Styles
        └── index.html    # HTML shell
```
