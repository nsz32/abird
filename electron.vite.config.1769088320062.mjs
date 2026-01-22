// electron.vite.config.ts
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
var __electron_vite_injected_dirname = "/home/nico/devel/bird";
var sharedAlias = {
  "@shared": resolve(__electron_vite_injected_dirname, "src/shared")
};
var rendererAlias = {
  ...sharedAlias,
  "@ui": resolve(__electron_vite_injected_dirname, "src/ui")
};
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/main/index.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: sharedAlias },
    build: {
      lib: {
        entry: resolve(__electron_vite_injected_dirname, "src/preload/index.ts"),
        formats: ["cjs"],
        fileName: () => "index.js"
      },
      rollupOptions: {
        output: {
          entryFileNames: "index.js"
        }
      }
    }
  },
  renderer: {
    root: "src/ui",
    publicDir: "public",
    plugins: [react()],
    resolve: { alias: rendererAlias },
    build: {
      rollupOptions: {
        input: {
          navbar: resolve(__electron_vite_injected_dirname, "src/ui/navbar/index.html"),
          notifications: resolve(__electron_vite_injected_dirname, "src/ui/notifications/index.html"),
          downloads: resolve(__electron_vite_injected_dirname, "src/ui/downloads/index.html"),
          findbar: resolve(__electron_vite_injected_dirname, "src/ui/findbar/index.html"),
          watermark: resolve(__electron_vite_injected_dirname, "src/ui/watermark/index.html"),
          config: resolve(__electron_vite_injected_dirname, "src/ui/config/index.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
