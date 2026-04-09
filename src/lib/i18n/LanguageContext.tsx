'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { translations } from './translations'

type Language = 'tr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: async () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [language, setLanguageState] = useState<Language>('tr')

  useEffect(() => {
    const sessionLang = (session?.user as any)?.language
    if (sessionLang === 'tr' || sessionLang === 'en') {
      setLanguageState(sessionLang)
    }
  }, [session])

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang)
    await fetch('/api/user/language', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang }),
    })
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = (translations as any)[language]
    for (const k of keys) {
      value = value?.[k]
    }
    if (typeof value === 'string') return value
    // fallback to TR
    value = (translations as any)['tr']
    for (const k of keys) {
      value = value?.[k]
    }
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
