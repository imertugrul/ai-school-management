'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
}

export default function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  if (variant === 'full') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {language === 'tr' ? 'Arayüz Dili' : 'Language'}
        </p>
        <div className="flex gap-2">
          {([
            { code: 'tr', flag: '🇹🇷', label: 'TR' },
            { code: 'en', flag: '🇬🇧', label: 'EN' },
          ] as const).map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              title={code === 'tr' ? 'Türkçe' : 'English'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                language === code
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // compact: single toggle button cycling between TR/EN
  return (
    <button
      onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
      title={language === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all"
    >
      <span>{language === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
      <span>{language === 'tr' ? 'TR' : 'EN'}</span>
    </button>
  )
}
