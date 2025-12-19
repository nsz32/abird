import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"

const sharedAlias = {
	"@shared": resolve(__dirname, "src/shared"),
}

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		resolve: { alias: sharedAlias },
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
		resolve: { alias: sharedAlias },
		build: {
			lib: {
				entry: resolve(__dirname, "src/preload/index.ts"),
				formats: ["cjs"],
				fileName: () => "index.js",
			},
			rollupOptions: {
				output: {
					entryFileNames: "index.js",
				},
			},
		},
	},
	renderer: {
		root: "src/overlays",
		plugins: [react()],
		resolve: { alias: sharedAlias },
		build: {
			rollupOptions: {
				input: {
					navigation: resolve(__dirname, "src/overlays/navigation/index.html"),
				},
			},
		},
	},
})
