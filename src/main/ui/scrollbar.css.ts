export const SCROLLBAR_CSS = `
/* Base - applies to both themes */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25);
    border: 3px solid transparent;
    background-clip: padding-box;
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:active {
    background: rgba(255, 255, 255, 0.5);
    border: 3px solid transparent;
    background-clip: padding-box;
  }
}

/* Light theme */
@media (prefers-color-scheme: light) {
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.25);
    border: 3px solid transparent;
    background-clip: padding-box;
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.4);
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:active {
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid transparent;
    background-clip: padding-box;
  }
}
`
