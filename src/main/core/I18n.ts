import { type Locale, type Translations, translations } from "@shared/i18n"
import { app } from "electron"
import { createLogger } from "../utils/logger"

const log = createLogger("I18n")

const SUPPORTED_LOCALES: Locale[] = ["en", "fr"]
const FALLBACK_LOCALE: Locale = "en"

function detectLocale(): Locale {
	const systemLocale = app.getLocale().split("-")[0] // "fr-FR" → "fr"
	return SUPPORTED_LOCALES.includes(systemLocale as Locale) ? (systemLocale as Locale) : FALLBACK_LOCALE
}

let currentLocale: Locale = FALLBACK_LOCALE

export function initI18n() {
	currentLocale = detectLocale()
	log.info(`Detected locale: ${currentLocale}`)
}

export function getLocale(): Locale {
	return currentLocale
}

export function getTranslations(): Translations {
	return translations[currentLocale]
}

export function t(key: keyof Translations): string {
	return translations[currentLocale][key]
}
