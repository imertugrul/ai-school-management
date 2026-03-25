'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, Translations } from '@/lib/i18n/translations'

interface LanguageContextValue {
  lang: Language
  setLang: (l: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'tr',
  setLang: () => {},
  t: translations.tr,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('tr')

  // Read from localStorage on mount (client only)
  useEffect(() => {
    const stored = localStorage.getItem('schoolpro_lang')
    if (stored === 'tr' || stored === 'en' || stored === 'de') {
      setLangState(stored)
    }
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    localStorage.setItem('schoolpro_lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] ?? translations.tr }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
