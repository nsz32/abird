import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, "src/main/index.ts"),
				},
			},
		},
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, "src/preload/index.ts"),
				},
			},
		},
	},
	renderer: {
		root: "src/overlays",
		plugins: [react()],
		build: {
			rollupOptions: {
				input: {
					navigation: resolve(__dirname, "src/overlays/navigation/index.html"),
				},
			},
		},
	},
})
