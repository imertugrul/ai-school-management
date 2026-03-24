'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingFooter() {
  const { t } = useLanguage()

  const columns = [
    {
      title: t.footer.product,
      links: [
        { label: t.footer.features,     href: '#features' },
        { label: t.footer.pricing_link, href: '#pricing' },
        { label: t.footer.demo,         href: '#contact' },
        { label: t.footer.support,      href: '#contact' },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.about,   href: '#' },
        { label: t.footer.careers, href: '#' },
        { label: t.footer.contact, href: '#contact' },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.privacy, href: '/privacy' },
        { label: t.footer.kvkk,   href: '/privacy' },
        { label: t.footer.terms,  href: '#' },
      ],
    },
  ]

  return (
    <footer style={{ backgroundColor: 'var(--text)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="font-body text-xl font-bold text-white">
                SchoolPro <span style={{ color: 'var(--accent)' }}>AI</span>
              </span>
            </div>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t.footer.tagline}
            </p>
          </div>
          {/* Columns */}
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-body text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: 'var(--accent)' }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href}
                      className="font-body text-sm transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 SchoolPro AI. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4 font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <span>🔒 KVKK</span>
            <span>|</span>
            <span>🛡️ GDPR</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
