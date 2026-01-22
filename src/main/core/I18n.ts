import { type Locale, type Translations, translations } from "@shared/i18n"
import { app } from "electron"

const SUPPORTED_LOCALES: Locale[] = ["en", "fr"]
const FALLBACK_LOCALE: Locale = "en"

function detectLocale(): Locale {
	const systemLocale = app.getLocale().split("-")[0] // "fr-FR" → "fr"
	return SUPPORTED_LOCALES.includes(systemLocale as Locale) ? (systemLocale as Locale) : FALLBACK_LOCALE
}

let currentLocale: Locale = FALLBACK_LOCALE

export function initI18n() {
	currentLocale = detectLocale()
	console.log(`[I18n] Detected locale: ${currentLocale}`)
}

export function getLocale(): Locale {
	return currentLocale
}

export function getTranslations(): Translations {
	return translations[currentLocale]
}
