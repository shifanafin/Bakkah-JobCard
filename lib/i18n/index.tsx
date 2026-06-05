'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { en } from './translations/en'
import { ar } from './translations/ar'
import { ur } from './translations/ur'
import { fr } from './translations/fr'
import { hi } from './translations/hi'
import { ta } from './translations/ta'
import { ml } from './translations/ml'

export type Lang = 'en' | 'ar' | 'ur' | 'fr' | 'hi' | 'ta' | 'ml'
export type AppTranslations = typeof en

const RTL_LANGS = new Set<Lang>(['ar', 'ur'])

export const LANG_META: Record<Lang, { label: string; code: string; flag: string }> = {
  en: { label: 'English',    code: 'EN', flag: '🇬🇧' },
  ar: { label: 'عربي',       code: 'AR', flag: '🇦🇪' },
  ur: { label: 'اردو',       code: 'UR', flag: '🇵🇰' },
  fr: { label: 'Français',   code: 'FR', flag: '🇫🇷' },
  hi: { label: 'हिंदी',      code: 'HI', flag: '🇮🇳' },
  ta: { label: 'தமிழ்',      code: 'TA', flag: '🇮🇳' },
  ml: { label: 'മലയാളം',     code: 'ML', flag: '🇮🇳' },
}

const TRANSLATIONS: Record<Lang, AppTranslations> = { en, ar, ur, fr, hi, ta, ml }

interface I18nCtx {
  lang: Lang
  t: AppTranslations
  setLang: (l: Lang) => void
  isRTL: boolean
}

const I18nContext = createContext<I18nCtx>({
  lang: 'en', t: en, setLang: () => {}, isRTL: false,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved && TRANSLATIONS[saved]) {
      setLangState(saved)
      applyToDOM(saved)
    }
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
    applyToDOM(l)
  }

  return (
    <I18nContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang, isRTL: RTL_LANGS.has(lang) }}>
      {children}
    </I18nContext.Provider>
  )
}

function applyToDOM(l: Lang) {
  const dir = RTL_LANGS.has(l) ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('lang', l)
  document.documentElement.setAttribute('dir', dir)
}

export const useT = () => useContext(I18nContext)
