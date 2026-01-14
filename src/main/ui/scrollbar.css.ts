export const SCROLLBAR_CSS = `
/* Base */
:root {
  scrollbar-width: thin;
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-track {
    background: #202020;
  }
  ::-webkit-scrollbar-thumb {
    background: #5a5a5a;
    border: 2px solid #202020;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #787878;
  }
  ::-webkit-scrollbar-thumb:active {
    background: #8a8a8a;
  }
  ::-webkit-scrollbar-corner {
    background: #202020;
  }
}

/* Light theme */
@media (prefers-color-scheme: light) {
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border: 2px solid #f1f1f1;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  ::-webkit-scrollbar-thumb:active {
    background: #787878;
  }
  ::-webkit-scrollbar-corner {
    background: #f1f1f1;
  }
}
`
