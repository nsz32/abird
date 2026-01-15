import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ColorModeProvider } from "../../components/ui/color-mode"
import { App } from "./App"

const root = document.getElementById("root")
if (root) {
	createRoot(root).render(
		<StrictMode>
			<ChakraProvider value={defaultSystem}>
				<ColorModeProvider>
					<App />
				</ColorModeProvider>
			</ChakraProvider>
		</StrictMode>,
	)
}
