import { arTranslations } from "./ar"
import { deTranslations } from "./de"
import { type TranslationKey, type Translations, enTranslations } from "./en"
import { esTranslations } from "./es"
import { frTranslations } from "./fr"
import { hiTranslations } from "./hi"
import { itTranslations } from "./it"
import { ptTranslations } from "./pt"
import { ruTranslations } from "./ru"
import { zhTranslations } from "./zh"

export type Locale = "ar" | "de" | "en" | "es" | "fr" | "hi" | "it" | "pt" | "ru" | "zh"
export type { TranslationKey, Translations }

export const translations: Record<Locale, Translations> = {
	ar: arTranslations,
	de: deTranslations,
	en: enTranslations,
	es: esTranslations,
	fr: frTranslations,
	hi: hiTranslations,
	it: itTranslations,
	pt: ptTranslations,
	ru: ruTranslations,
	zh: zhTranslations,
}
