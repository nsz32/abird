# Stratégie de récupération des icônes

Inspiré de [webapp-manager](https://github.com/linuxmint/webapp-manager) (Linux Mint).

## Sources d'icônes (par ordre de priorité)

| Priorité | Source | Sélecteur | Qualité |
|----------|--------|-----------|---------|
| 1 | Apple Touch Icon | `<link rel="apple-touch-icon">` | 180x180+ |
| 2 | Icon HD | `<link rel="icon" sizes="192x192">` | 192x192 |
| 3 | MS Tile | `<meta name="msapplication-TileImage">` | 144x144 |
| 4 | Open Graph | `<meta property="og:image">` | Variable |
| 5 | Icon standard | `<link rel="icon">` ou `<link rel="shortcut icon">` | 16-64px |
| 6 | Favicon classique | `/favicon.ico` | 16-64px |
| 7 | Google API | `https://www.google.com/s2/favicons?domain=X&sz=128` | 128px max |

## Implémentation Bird

Utiliser un `WebContentsView` caché + `executeJavaScript()` :

```javascript
(function() {
  const get = (sel, attr = 'href') => {
    const el = document.querySelector(sel);
    return el ? (el[attr] || el.getAttribute(attr)) : null;
  };
  return {
    appleTouchIcon: get('link[rel="apple-touch-icon"]'),
    icon192: get('link[rel="icon"][sizes*="192"]'),
    icon: get('link[rel="icon"]') || get('link[rel="shortcut icon"]'),
    ogImage: get('meta[property="og:image"]', 'content'),
    msIcon: get('meta[name="msapplication-TileImage"]', 'content'),
  };
})()
```

## Métadonnées bonus

En même temps, récupérer :
- `document.title` → nom de l'app
- `<meta name="theme-color">` → couleur de thème
- `<meta name="description">` → description

## Fallbacks

1. Si aucune icône trouvée → `/favicon.ico`
2. Si échec → Google Favicon API
3. Si échec → icône par défaut Bird
