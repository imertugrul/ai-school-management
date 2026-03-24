'use client'

import { useEffect, useRef } from 'react'

const PLANS = [
  {
    name: 'Ücretsiz',
    price: '0₺',
    period: '/ay',
    description: '50 öğrenciye kadar',
    features: [
      'Temel özellikler',
      '50 öğrenci limiti',
      'AI özellikleri sınırlı',
      'Email destek',
      '5 öğretmen',
    ],
    cta: 'Başla',
    ctaHref: '/signup',
    featured: false,
  },
  {
    name: 'Okul',
    price: '$5',
    period: '/öğrenci/yıl',
    description: 'En popüler plan',
    features: [
      'Sınırsız öğrenci',
      'Tüm AI özellikleri',
      'WhatsApp & Email bildirimleri',
      '7/24 canlı destek',
      'Gelişmiş analitik',
      'CSV import/export',
      'Özel müfredat desteği',
    ],
    cta: 'Hemen Dene',
    ctaHref: '#contact',
    featured: true,
    badge: 'En Popüler',
  },
  {
    name: 'Bölge',
    price: 'Özel',
    period: '',
    description: 'Çok okul desteği',
    features: [
      'Çok okul yönetimi',
      'Özel entegrasyon',
      'Beyaz etiket seçeneği',
      'Öncelikli destek',
      'SLA garantisi',
      'Özel eğitim',
    ],
    cta: 'Bize Yazın',
    ctaHref: '#contact',
    featured: false,
  },
]

export default function LandingPricing() {
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

  return (
    <section id="pricing" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'rgba(11,31,75,0.05)', color: 'var(--navy)' }}>
            Fiyatlandırma
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text-dark)' }}>
            Okulunuzun Büyüklüğüne Göre
            <br />Fiyatlandırma
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            Tüm planlara 14 günlük ücretsiz deneme dahil
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className={`reveal reveal-delay-${i + 1} relative flex flex-col rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1`}
              style={plan.featured ? {
                backgroundColor: 'var(--navy)',
                boxShadow: '0 24px 64px rgba(11,31,75,0.35)',
                transform: 'scale(1.04)',
              } : {
                backgroundColor: '#ffffff',
                border: '1px solid rgba(11,31,75,0.1)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-body text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--navy)' }}
                >
                  ⭐ {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <p className="font-body text-sm font-semibold tracking-widest uppercase mb-2"
                  style={{ color: plan.featured ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="font-display font-bold text-5xl"
                    style={{ color: plan.featured ? '#ffffff' : 'var(--text-dark)' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="font-body text-sm mb-2" style={{ color: plan.featured ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="font-body text-sm mt-1" style={{ color: plan.featured ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                  {plan.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px mb-6" style={{ backgroundColor: plan.featured ? 'rgba(255,255,255,0.1)' : 'rgba(11,31,75,0.08)' }} />

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 font-body text-sm">
                    <span style={{ color: plan.featured ? 'var(--gold)' : '#22c55e', flexShrink: 0 }}>✓</span>
                    <span style={{ color: plan.featured ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={plan.ctaHref}
                className="block text-center font-body font-semibold py-3.5 rounded-xl transition-all hover:scale-105 text-sm"
                style={plan.featured ? {
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  color: 'var(--navy)',
                  boxShadow: '0 8px 24px rgba(201,168,76,0.4)',
                } : {
                  backgroundColor: 'rgba(11,31,75,0.06)',
                  color: 'var(--navy)',
                  border: '1px solid rgba(11,31,75,0.12)',
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
