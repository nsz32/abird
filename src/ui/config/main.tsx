import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

const root = document.getElementById("root")
if (root) {
	createRoot(root).render(
		<StrictMode>
			<ChakraProvider value={defaultSystem}>
				<App />
			</ChakraProvider>
		</StrictMode>,
	)
}
