'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import type { Language } from '@/lib/i18n/translations'

const LANG_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

export default function LandingNavbar() {
  const { t, lang, setLang } = useLanguage()
  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen]   = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close lang dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLinks = [
    { label: t.nav.features,    href: '#features' },
    { label: t.nav.howItWorks,  href: '#how-it-works' },
    { label: t.nav.pricing,     href: '#pricing' },
    { label: t.nav.faq,         href: '#faq' },
  ]

  const textColor = scrolled ? 'var(--text-muted)' : 'rgba(15,23,42,0.7)'
  const textHover = scrolled ? 'var(--primary)' : 'var(--primary)'
  const current = LANG_OPTIONS.find(l => l.code === lang)!

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 1px 20px rgba(15,23,42,0.08)' : 'none',
        borderBottom: scrolled ? '1px solid var(--gray-200)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🎓</span>
            <span className="font-body text-xl font-bold" style={{ color: 'var(--primary)' }}>
              SchoolPro <span style={{ color: 'var(--accent)' }}>AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, href }) => (
              <a key={href} href={href}
                className="font-body text-sm font-medium transition-colors"
                style={{ color: textColor }}
                onMouseEnter={e => (e.currentTarget.style.color = textHover)}
                onMouseLeave={e => (e.currentTarget.style.color = textColor)}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div ref={langRef} className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-colors hover:bg-gray-100"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>{current.flag}</span>
                <span>{current.code.toUpperCase()}</span>
                <span className="text-[10px] opacity-60">{langOpen ? '▲' : '▼'}</span>
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 top-full mt-1 rounded-xl shadow-xl overflow-hidden z-50"
                  style={{ backgroundColor: '#fff', border: '1px solid var(--gray-200)', width: '140px' }}
                >
                  {LANG_OPTIONS.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => { setLang(opt.code); setLangOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left font-body text-sm transition-colors hover:bg-gray-50"
                      style={{ fontWeight: lang === opt.code ? 700 : 400, color: lang === opt.code ? 'var(--primary)' : 'var(--text-muted)' }}
                    >
                      <span>{opt.flag}</span> {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/login"
              className="hidden md:inline-flex items-center font-body text-sm font-semibold px-4 py-2 rounded-xl border transition-all hover:bg-gray-50"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--primary)' }}>
              {t.nav.login}
            </Link>
            <a href="#contact"
              className="inline-flex items-center font-body text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px rgba(79,142,247,0.35)' }}>
              {t.nav.demo}
            </a>
            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--primary)' }}
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t py-4 space-y-1 font-body bg-white"
            style={{ borderColor: 'var(--gray-200)' }}>
            {navLinks.map(({ label, href }) => (
              <a key={href} href={href}
                className="block px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-50"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setMobileOpen(false)}>
                {label}
              </a>
            ))}
            {/* Mobile language */}
            <div className="px-4 pt-2 pb-1 flex gap-2">
              {LANG_OPTIONS.map(opt => (
                <button key={opt.code} onClick={() => setLang(opt.code)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    borderColor: lang === opt.code ? 'var(--accent)' : 'var(--gray-200)',
                    backgroundColor: lang === opt.code ? 'var(--primary-pale)' : 'transparent',
                    color: lang === opt.code ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                  {opt.flag} {opt.code.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="px-4 pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-sm font-semibold py-2.5 text-center rounded-xl border"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                {t.nav.login}
              </Link>
              <a href="#contact" className="text-sm font-semibold py-2.5 text-center rounded-xl text-white"
                style={{ backgroundColor: 'var(--accent)' }}>
                {t.nav.demo}
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
