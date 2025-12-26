# Code Style

## Principes

- **Une fonction/méthode = une responsabilité** (nommée explicitement)
- **Méthodes publiques courtes** : orchestration seulement, logique déléguée aux privées
- **Pas de blocs inline complexes** : extraire dans des méthodes/fonctions nommées
- **Constructeurs épurés** : initialisation + appels de setup, pas de logique

## Structure des classes

```
Propriétés → Constructeur → API publique → Méthodes privées
```

## Structure des modules

```
Imports → Constantes → Fonction principale → Fonctions auxiliaires → Exports
```

## Règles

- Noms de méthodes = verbes d'action (`createCallbacks`, `handleTabReady`, `emitNavState`)
- Pas de commentaires évidents (le code se documente par ses noms)
- Alias pour accès répétés (`this.wc = this.view.webContents`)
- Logique conditionnelle complexe → méthode privée dédiée
