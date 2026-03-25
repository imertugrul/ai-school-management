'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingSecurity() {
  const { t } = useLanguage()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    el.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const sec = (t as any).security ?? {
    title: 'Enterprise-Grade Security',
    subtitle: 'Built for schools that take data privacy seriously',
    features: [
      { icon: '🔒', title: 'KVKK & GDPR Compliant', desc: 'Student data never sent to AI systems. Full compliance centre built-in.' },
      { icon: '🛡️', title: 'Two-Factor Authentication', desc: 'Extra security for admin accounts. Google Authenticator & Authy supported.' },
      { icon: '🔑', title: 'Role-Based Access Control', desc: '6 distinct roles. Each user sees only what they need.' },
      { icon: '📋', title: 'Audit Logs', desc: 'Every AI call logged. Personal data never reaches AI systems. Full audit trail.' },
    ],
    badges: ['🔒 KVKK Compliant', '🛡️ GDPR Ready', '🔐 Data Encrypted', '✅ AI Anonymized', '🏦 Vercel Enterprise', '🗄️ Neon PostgreSQL'],
  }

  return (
    <section ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            🔒 Security
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            {sec.title}
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            {sec.subtitle}
          </p>
        </div>

        {/* Feature cards 2×2 */}
        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          {sec.features.map((feat: { icon: string; title: string; desc: string }, i: number) => (
            <div key={i}
              className={`reveal reveal-delay-${i + 1} group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              style={{
                backgroundColor: '#fff',
                border: '1px solid var(--gray-200)',
                boxShadow: '0 2px 16px rgba(15,23,42,0.06)',
              }}>
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: 'var(--primary-pale)' }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
                    {feat.title}
                  </h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges strip */}
        <div className="reveal flex flex-wrap justify-center gap-3">
          {sec.badges.map((badge: string, i: number) => (
            <span key={i}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-sm font-semibold"
              style={{
                backgroundColor: '#fff',
                border: '1px solid var(--gray-200)',
                color: 'var(--text)',
                boxShadow: '0 1px 8px rgba(15,23,42,0.06)',
              }}>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
