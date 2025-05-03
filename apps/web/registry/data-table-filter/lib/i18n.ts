import en from '../locales/en.json'
import fr from '../locales/fr.json'
import zh_CN from '../locales/zh-CN.json'
import zh_TW from '../locales/zh-TW.json'

export type Locale = 'en' | 'fr' | 'zh_CN' | 'zh_TW'

type Translations = Record<string, string>

const translations: Record<Locale, Translations> = {
  en,
  fr,
  zh_CN,
  zh_TW,
}

export function t(key: string, locale: Locale): string {
  return translations[locale][key] ?? key
}
