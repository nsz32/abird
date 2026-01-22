import { type TranslationKey, type Translations, enTranslations } from "./en"
import { frTranslations } from "./fr"

export type Locale = "en" | "fr"
export type { TranslationKey, Translations }

export const translations: Record<Locale, Translations> = {
	en: enTranslations,
	fr: frTranslations,
}
