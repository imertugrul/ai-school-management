'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingPricing() {
  const { t } = useLanguage()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    el.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const plans = [
    {
      name: t.pricing.free,
      price: '0₺',
      period: '/ay',
      desc: '50 öğrenciye kadar',
      features: t.pricing.freeFeatures,
      cta: t.pricing.cta1,
      href: '/signup',
      featured: false,
    },
    {
      name: t.pricing.school,
      price: '$5',
      period: `/${t.pricing.perStudentYear}`,
      desc: t.pricing.popular,
      features: t.pricing.schoolFeatures,
      cta: t.pricing.cta2,
      href: '#contact',
      featured: true,
      badge: t.pricing.popular,
    },
    {
      name: t.pricing.district,
      price: t.pricing.custom,
      period: '',
      desc: '',
      features: t.pricing.districtFeatures,
      cta: t.pricing.cta3,
      href: '#contact',
      featured: false,
    },
  ]

  return (
    <section id="pricing" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--white)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            Fiyatlandırma
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            {t.pricing.title}
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, i) => (
            <div key={plan.name}
              className={`reveal reveal-delay-${i + 1} relative flex flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1`}
              style={plan.featured ? {
                backgroundColor: 'var(--primary)',
                boxShadow: '0 20px 60px rgba(30,58,95,0.35)',
                transform: 'scale(1.04)',
              } : {
                backgroundColor: '#fff',
                border: '1px solid var(--gray-200)',
                boxShadow: '0 2px 16px rgba(15,23,42,0.06)',
              }}>
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-body text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px rgba(79,142,247,0.4)' }}>
                  ⭐ {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <p className="font-body text-xs font-bold tracking-widest uppercase mb-2"
                  style={{ color: plan.featured ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="font-display font-bold text-5xl"
                    style={{ color: plan.featured ? '#fff' : 'var(--text)' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="font-body text-sm mb-2"
                      style={{ color: plan.featured ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.desc && (
                  <p className="font-body text-xs mt-1"
                    style={{ color: plan.featured ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)' }}>
                    {plan.desc}
                  </p>
                )}
              </div>

              <div className="h-px mb-6"
                style={{ backgroundColor: plan.featured ? 'rgba(255,255,255,0.12)' : 'var(--gray-200)' }} />

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 font-body text-sm">
                    <span style={{ color: plan.featured ? '#60a5fa' : 'var(--green)', flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span style={{ color: plan.featured ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <a href={plan.href}
                className="block text-center font-body font-semibold py-3.5 rounded-xl transition-all hover:scale-105 text-sm"
                style={plan.featured ? {
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(79,142,247,0.4)',
                } : {
                  backgroundColor: 'var(--primary-pale)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(30,58,95,0.15)',
                }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
