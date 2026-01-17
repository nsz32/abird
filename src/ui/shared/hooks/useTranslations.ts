import type { TranslationKey, Translations } from "@shared/i18n/translations"
import { useEffect, useState } from "react"

let cachedTranslations: Translations | null = null

export function useTranslations() {
	const [translations, setTranslations] = useState<Translations | null>(cachedTranslations)

	useEffect(() => {
		if (cachedTranslations) return
		window.bird.i18n.getTranslations().then((t) => {
			cachedTranslations = t
			setTranslations(t)
		})
	}, [])

	const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
		if (!translations) return key
		let text = translations[key]
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				text = text.replace(`{{${k}}}`, String(v))
			}
		}
		return text
	}

	return { t, ready: translations !== null }
}
