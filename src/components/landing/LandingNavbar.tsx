'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Özellikler',    href: '#features' },
  { label: 'Nasıl Çalışır', href: '#how-it-works' },
  { label: 'Fiyatlandırma', href: '#pricing' },
  { label: 'SSS',           href: '#faq' },
]

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 1px 24px rgba(11,31,75,0.10)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(11,31,75,0.08)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🎓</span>
            <span
              className="text-xl font-bold transition-colors font-body"
              style={{ color: scrolled ? 'var(--navy)' : '#ffffff' }}
            >
              SchoolPro{' '}
              <span style={{ color: 'var(--gold)' }}>AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium transition-colors font-body"
                style={{ color: scrolled ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)' }}
                onMouseEnter={e => (e.currentTarget.style.color = scrolled ? 'var(--navy)' : '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)')}
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center text-sm font-semibold px-4 py-2 rounded-xl border transition-all font-body"
              style={scrolled
                ? { borderColor: 'var(--navy)', color: 'var(--navy)' }
                : { borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }
              }
            >
              Giriş Yap
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 hover:shadow-lg font-body"
              style={{
                background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                color: 'var(--navy)',
              }}
            >
              Demo Talep Et
            </a>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: scrolled ? 'var(--navy)' : '#fff' }}
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menü"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t py-4 space-y-2 font-body"
            style={{ borderColor: 'rgba(11,31,75,0.08)', backgroundColor: 'rgba(255,255,255,0.98)' }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="pt-2 px-4 flex flex-col gap-2">
              <Link href="/login" className="text-sm font-semibold py-2 text-center rounded-xl border" style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}>
                Giriş Yap
              </Link>
              <a href="#contact" className="text-sm font-semibold py-2 text-center rounded-xl" style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--navy)' }}>
                Demo Talep Et
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
