export const SCROLLBAR_CSS = `
:root {
  scrollbar-width: thin;
}

@media (prefers-color-scheme: dark) {
  :root {
    scrollbar-color: #777 #222;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    scrollbar-color: #777 #ddd;
  }
}
`
