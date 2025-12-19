# Phase 1 - Fondations

## Objectif

Poser les bases architecturales en implémentant **une seule fonctionnalité bout-en-bout** : la navigation (back/forward/reload). Cela force à créer chaque couche de l'application de manière minimale mais fonctionnelle.

---

## Principe directeur

> "Make it work, make it right, make it fast" — Kent Beck

On fait **marcher** d'abord. On a le droit d'avoir du code simple, voire naïf. L'important est d'établir les connexions entre les couches.

---

## Structure cible

```
src/
├── main/
│   ├── index.ts              # Lifecycle (existe)
│   ├── window.ts             # Window management (existe)
│   └── api/
│       └── navigation.ts     # Fonctions navigation
│
├── preload/
│   └── index.ts              # contextBridge avec API navigation
│
├── overlays/
│   └── navigation/           # UI (existe, à connecter)
│
└── shared/
    └── types.ts              # Types partagés main/renderer
```

Pas de dossier `ipc/` séparé pour l'instant. Les handlers IPC vivent dans `main/api/navigation.ts` avec les fonctions. KISS.

---

## Les couches

### 1. Types partagés (`shared/types.ts`)

Un seul fichier avec les types essentiels. Pas de sur-découpage.

```typescript
// État de navigation (envoyé aux overlays)
interface NavigationState {
  url: string
  title: string
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
}

// Canaux IPC (évite les typos, autocomplétion)
const IpcChannels = {
  NAVIGATION_BACK: 'bird:navigation:back',
  NAVIGATION_FORWARD: 'bird:navigation:forward',
  NAVIGATION_RELOAD: 'bird:navigation:reload',
  NAVIGATION_STATE: 'bird:navigation:state',
  NAVIGATION_STATE_CHANGED: 'bird:navigation:state-changed',
} as const
```

**Pourquoi ?**
- Un fichier = pas de confusion sur où mettre quoi
- Les constantes IPC évitent les erreurs de frappe
- Importable depuis main ET renderer

---

### 2. API Navigation (`main/api/navigation.ts`)

Fonctions + handlers IPC dans le même fichier. Séparation prématurée = complexité inutile.

```typescript
// Fonctions (agissent sur siteView)
function goBack(): void
function goForward(): void
function reload(hard?: boolean): void
function getState(): NavigationState

// Handlers IPC (enregistrés au démarrage)
function registerHandlers(): void

// Push state aux overlays quand ça change
function setupStateSync(): void
```

**Pattern :**
1. Les fonctions font le travail
2. Les handlers IPC appellent les fonctions
3. `setupStateSync` écoute les events webContents et push l'état

**Pourquoi tout dans un fichier ?**
- On voit tout d'un coup d'œil
- Pas de ping-pong entre fichiers
- On splittera si ça grandit trop (YAGNI)

---

### 3. Preload (`preload/index.ts`)

Expose l'API au renderer via `contextBridge`.

```typescript
contextBridge.exposeInMainWorld('bird', {
  navigation: {
    back: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_BACK),
    forward: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_FORWARD),
    reload: (hard?: boolean) => ipcRenderer.invoke(IpcChannels.NAVIGATION_RELOAD, hard),
    getState: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_STATE),
    onStateChanged: (callback) => /* ... */,
  }
})
```

**Point d'attention :** `onStateChanged` doit gérer le cleanup (return une fonction unlisten).

---

### 4. Overlay Navigation (`overlays/navigation/`)

L'UI React qui :
1. Affiche l'état (boutons disabled si can't go back/forward)
2. Appelle l'API sur click

```typescript
// Au mount : récupérer l'état initial + s'abonner aux changements
useEffect(() => {
  bird.navigation.getState().then(setState)
  return bird.navigation.onStateChanged(setState)
}, [])

// Actions
<button onClick={() => bird.navigation.back()} disabled={!state.canGoBack}>←</button>
```

---

## Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│                         MAIN PROCESS                         │
│                                                               │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────┐  │
│  │  siteView   │───▶│ api/navigation   │◀───│ ipcMain    │  │
│  │ webContents │    │   (functions)    │    │ (handlers) │  │
│  └─────────────┘    └──────────────────┘    └────────────┘  │
│         │                    │                     ▲         │
│         │                    │ push state          │         │
│         ▼                    ▼                     │         │
│  [events: did-navigate, did-start-loading, ...]   │         │
│                              │                     │         │
├──────────────────────────────┼─────────────────────┼─────────┤
│                    PRELOAD   │                     │         │
│                              │                     │         │
│              contextBridge (bird.navigation.*)     │         │
│                              │                     │         │
├──────────────────────────────┼─────────────────────┼─────────┤
│                   OVERLAY    │                     │         │
│                              ▼                     │         │
│  ┌─────────────────────────────────────────────────┴──────┐ │
│  │                     React App                          │ │
│  │   state ──▶ UI (buttons) ──▶ bird.navigation.back()    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Ordre d'implémentation

| # | Fichier | Quoi | Dépend de |
|---|---------|------|-----------|
| 1 | `shared/types.ts` | Types + constantes IPC | - |
| 2 | `main/api/navigation.ts` | Fonctions + handlers | #1 |
| 3 | `main/index.ts` | Appeler `registerHandlers()` | #2 |
| 4 | `preload/index.ts` | Exposer `bird.navigation` | #1 |
| 5 | `overlays/navigation/` | Connecter UI | #4 |

Chaque étape est testable indépendamment.

---

## Ce qu'on NE fait PAS (encore)

| Feature | Pourquoi pas maintenant |
|---------|------------------------|
| Config système | On hardcode l'URL pour l'instant |
| Tabs | Une seule vue suffit pour valider l'archi |
| Downloads | Pas besoin pour la navigation |
| Events cancelables | Over-engineering pour phase 1 |
| Script injection | L'overlay prouve déjà le concept IPC |
| Autres modules API | Navigation suffit comme POC |

---

## Critères de succès

Phase 1 est terminée quand :

- [ ] L'overlay affiche des vrais boutons (pas juste du texte)
- [ ] Cliquer "←" appelle `bird.navigation.back()` et ça marche
- [ ] Cliquer "→" appelle `bird.navigation.forward()` et ça marche
- [ ] Cliquer "↻" appelle `bird.navigation.reload()` et ça marche
- [ ] Les boutons back/forward sont disabled quand non disponibles
- [ ] L'état se met à jour automatiquement quand on navigue sur le site

---

## Questions ouvertes

### Q1 : Comment importer `shared/types.ts` depuis main ET renderer ?

**Options :**
- A) Alias Vite/TypeScript (`@shared/types`)
- B) Chemin relatif (`../../shared/types`)
- C) Package interne (`@bird/shared`)

**Recommandation :** Option A (alias). Simple à configurer dans electron-vite.

### Q2 : `ipcMain.handle` vs `ipcMain.on` ?

**Réponse :**
- `handle` pour requêtes avec réponse (getState, actions qui confirment)
- `on` pour fire-and-forget (pas notre cas ici)

On utilise `handle` partout pour la cohérence.

### Q3 : Comment push l'état aux overlays ?

**Options :**
- A) `webContents.send()` vers chaque overlay
- B) Event global, overlays s'abonnent

**Recommandation :** Option A pour l'instant. On n'a qu'un overlay.

---

## Notes d'implémentation

### Events webContents à écouter

```typescript
// Pour mettre à jour NavigationState
siteView.webContents.on('did-navigate', updateAndPushState)
siteView.webContents.on('did-navigate-in-page', updateAndPushState)
siteView.webContents.on('did-start-loading', updateAndPushState)
siteView.webContents.on('did-stop-loading', updateAndPushState)
siteView.webContents.on('page-title-updated', updateAndPushState)
```

### Accès à siteView depuis api/navigation.ts

On a besoin d'accéder à `siteView` depuis le module navigation. Options :

- A) Passer `siteView` à `registerHandlers(siteView)`
- B) Getter global `getSiteView()` (existe déjà dans window.ts)
- C) Singleton/registry

**Recommandation :** Option B. Le getter existe, on l'utilise.

---

## TODO

- [x] 1. Configurer alias `@shared` dans electron-vite
- [x] 2. Créer `src/shared/types.ts` (NavigationState, IpcChannels)
- [x] 3. Créer `src/main/api/navigation.ts` (fonctions navigation)
- [x] 4. Ajouter handlers IPC dans navigation.ts
- [x] 5. Ajouter `registerNavigationHandlers()` dans main/index.ts
- [x] 6. Ajouter `setupNavigationStateSync()` pour push état
- [x] 7. Enrichir `preload/index.ts` avec bird.navigation.*
- [x] 8. Refaire UI overlay navigation (vrais boutons)
- [x] 9. Connecter overlay à l'API (state + actions)
- [ ] 10. Tester : back/forward/reload fonctionnent
- [ ] 11. Tester : boutons disabled quand approprié
- [ ] 12. Tester : état se met à jour à la navigation
