import en from '../locales/en.json'
import fr from '../locales/fr.json'

export type Locale = 'en' | 'fr'

type Translations = Record<string, string>

const translations: Record<Locale, Translations> = {
  en,
  fr,
}

export function t(key: string, locale: Locale): string {
  return translations[locale][key] ?? key
}
