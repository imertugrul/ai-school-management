'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const ROLES = [
  {
    key: 'teacher' as const,
    icon: '👩‍🏫',
    href: '/features/teacher',
    accent: 'var(--primary)',
    pale: 'var(--primary-pale)',
    shadow: 'rgba(30,58,95,0.18)',
    border: 'rgba(30,58,95,0.15)',
  },
  {
    key: 'student' as const,
    icon: '👨‍🎓',
    href: '/features/student',
    accent: '#059669',
    pale: '#ecfdf5',
    shadow: 'rgba(5,150,105,0.14)',
    border: 'rgba(5,150,105,0.2)',
  },
  {
    key: 'parent' as const,
    icon: '👨‍👩‍👧',
    href: '/features/parent',
    accent: '#7c3aed',
    pale: '#f5f3ff',
    shadow: 'rgba(124,58,237,0.14)',
    border: 'rgba(124,58,237,0.2)',
  },
  {
    key: 'admin' as const,
    icon: '👑',
    href: '/features/admin',
    accent: '#D97706',
    pale: '#FEF3C7',
    shadow: 'rgba(217,119,6,0.14)',
    border: 'rgba(217,119,6,0.2)',
  },
  {
    key: 'staff' as const,
    icon: '🏫',
    href: '/features/staff',
    accent: '#475569',
    pale: '#F1F5F9',
    shadow: 'rgba(71,85,105,0.12)',
    border: 'rgba(71,85,105,0.18)',
  },
]

export default function LandingRoles() {
  const { t } = useLanguage()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--gray-50)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            Roller
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            {t.roles.title}
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            {t.roles.subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {ROLES.map((role, i) => {
            const data = t.roles[role.key]
            return (
              <div
                key={role.key}
                className={`reveal reveal-delay-${i + 1} flex flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2`}
                style={{
                  backgroundColor: '#fff',
                  border: `1px solid ${role.border}`,
                  boxShadow: `0 4px 24px ${role.shadow}`,
                }}
              >
                {/* Icon + title */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: role.pale }}
                  >
                    {role.icon}
                  </div>
                  <h3 className="font-display font-bold text-2xl" style={{ color: 'var(--text)' }}>
                    {data.title}
                  </h3>
                </div>

                {/* Divider */}
                <div className="h-px mb-6" style={{ backgroundColor: role.border }} />

                {/* Feature list */}
                <ul className="space-y-3 flex-1 mb-8">
                  {data.features.map((feat: string, fi: number) => (
                    <li key={fi} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: role.pale, color: role.accent }}
                      >
                        ✓
                      </span>
                      <span className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={role.href}
                  className="block text-center font-body font-semibold py-3.5 rounded-xl text-sm transition-all hover:scale-105"
                  style={{
                    backgroundColor: role.pale,
                    color: role.accent,
                    border: `1px solid ${role.border}`,
                  }}
                >
                  {t.roles.cta}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
