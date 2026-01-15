import { useEffect, useState } from "react"

export function useHashRouter() {
	const [route, setRoute] = useState(() => window.location.hash || "")

	useEffect(() => {
		const handleHashChange = () => {
			setRoute(window.location.hash || "")
		}

		window.addEventListener("hashchange", handleHashChange)
		return () => window.removeEventListener("hashchange", handleHashChange)
	}, [])

	const navigate = (hash: string) => {
		window.location.hash = hash
	}

	const goBack = () => {
		window.history.back()
	}

	return { route, navigate, goBack }
}
