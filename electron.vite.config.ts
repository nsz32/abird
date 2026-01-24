import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"

const sharedAlias = {
	"@shared": resolve(__dirname, "src/shared"),
}

const rendererAlias = {
	...sharedAlias,
	"@ui": resolve(__dirname, "src/ui"),
}

export default defineConfig({
	main: {
		plugins: [],
		resolve: { alias: sharedAlias },
		build: {
			minify: true,
			sourcemap: false,
			rollupOptions: {
				input: {
					index: resolve(__dirname, "src/main/index.ts"),
				},
				external: ["electron", "uiohook-napi", "@ghostery/adblocker-electron-preload"],
				treeshake: {
					moduleSideEffects: false,
				},
			},
		},
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		resolve: { alias: sharedAlias },
		build: {
			minify: true,
			sourcemap: false,
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
		root: "src/ui",
		publicDir: "public",
		plugins: [react()],
		resolve: { alias: rendererAlias },
		build: {
			minify: true,
			sourcemap: false,
			rollupOptions: {
				input: {
					navbar: resolve(__dirname, "src/ui/navbar/index.html"),
					notifications: resolve(__dirname, "src/ui/notifications/index.html"),
					downloads: resolve(__dirname, "src/ui/downloads/index.html"),
					findbar: resolve(__dirname, "src/ui/findbar/index.html"),
					watermark: resolve(__dirname, "src/ui/watermark/index.html"),
					config: resolve(__dirname, "src/ui/config/index.html"),
				},
			},
		},
	},
})
