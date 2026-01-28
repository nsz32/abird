import type { TranslationKey, Translations } from "@shared/i18n"
import { useEffect, useState } from "react"

let cachedTranslations: Translations | null = null

export function useTranslations() {
	const [translations, setTranslations] = useState<Translations | null>(cachedTranslations)

	useEffect(() => {
		if (cachedTranslations) return
		window.abird.i18n.getTranslations().then((t) => {
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

			// Resolve conditionals: {{param>1?"s":""}}
			text = text.replace(/\{\{(\w+)(<=?|>=?|!=|==?)(-?\d+)\?"([^"]*)":"([^"]*)"\}\}/g, (_, name, op, val, ifTrue, ifFalse) => {
				const n = Number(params[name] ?? 0)
				const v = Number(val)
				const match = op === ">" ? n > v : op === "<" ? n < v : op === ">=" ? n >= v : op === "<=" ? n <= v : op === "!=" ? n !== v : n === v
				return match ? ifTrue : ifFalse
			})
		}

		return text
	}

	return { t, ready: translations !== null }
}
