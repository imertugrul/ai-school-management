'use client'

import { LanguageProvider } from '@/context/LanguageContext'

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>
}
