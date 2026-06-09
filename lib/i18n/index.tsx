'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { en } from './translations/en'
import { getAITranslations } from './aiTranslate'

export type Lang = 'en' | 'ar' | 'ur' | 'fr' | 'hi' | 'ta'
export type AppTranslations = typeof en

const RTL_LANGS = new Set<Lang>(['ar', 'ur'])

export const LANG_META: Record<Lang, { label: string; code: string; flag: string }> = {
  en: { label: 'English',    code: 'EN', flag: '🇬🇧' },
  ar: { label: 'عربي',       code: 'AR', flag: '🇦🇪' },
  ur: { label: 'اردو',       code: 'UR', flag: '🇵🇰' },
  fr: { label: 'Français',   code: 'FR', flag: '🇫🇷' },
  hi: { label: 'हिंदी',      code: 'HI', flag: '🇮🇳' },
  ta: { label: 'தமிழ்',      code: 'TA', flag: '🇮🇳' },
}

interface I18nCtx {
  lang: Lang
  t: AppTranslations
  setLang: (l: Lang) => void
  isRTL: boolean
  translating: boolean
}

const I18nContext = createContext<I18nCtx>({
  lang: 'en', t: en, setLang: () => {}, isRTL: false, translating: false,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [translations, setTranslations] = useState<AppTranslations>(en)
  const [translating, setTranslating] = useState(false)

  const loadTranslations = useCallback(async (l: Lang) => {
    setLangState(l)
    applyToDOM(l)
    if (l === 'en') {
      setTranslations(en)
      return
    }
    setTranslating(true)
    try {
      const translated = await getAITranslations(en, l)
      setTranslations(translated as AppTranslations)
    } catch {
      setTranslations(en)
    } finally {
      setTranslating(false)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved && saved in LANG_META) loadTranslations(saved)
  }, [loadTranslations])

  async function setLang(l: Lang) {
    localStorage.setItem('lang', l)
    await loadTranslations(l)
  }

  return (
    <I18nContext.Provider value={{
      lang,
      t: translations,
      setLang,
      isRTL: RTL_LANGS.has(lang),
      translating,
    }}>
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
