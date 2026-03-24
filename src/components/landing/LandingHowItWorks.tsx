'use client'

import { useEffect, useRef } from 'react'

const STEPS = [
  {
    num: 1,
    icon: '🏫',
    title: 'Okulunuzu Kurun',
    desc: 'Öğretmen, öğrenci ve dersleri CSV ile dakikalar içinde yükleyin.',
  },
  {
    num: 2,
    icon: '⚙️',
    title: 'Sistemi Özelleştirin',
    desc: 'Müfredat tipini, ders programını ve bildirim tercihlerini ayarlayın.',
  },
  {
    num: 3,
    icon: '🚀',
    title: 'Hemen Kullanmaya Başlayın',
    desc: 'Öğretmenler ders planlar, notlar girer. Veliler anlık bildirim alır.',
  },
]

export default function LandingHowItWorks() {
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
    <section id="how-it-works" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--gray-50)', backgroundColor2: '#F8F9FA' } as React.CSSProperties}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'rgba(11,31,75,0.05)', color: 'var(--navy)' }}>
            Süreç
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text-dark)' }}>
            3 Adımda Başlayın
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            Kurulum ve başlangıç son derece kolay
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5"
            style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))' }} />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${i + 1} group flex flex-col items-center text-center`}
              >
                {/* Step number circle */}
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl z-10"
                  style={{
                    background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
                    boxShadow: '0 8px 32px rgba(11,31,75,0.25)',
                    border: '3px solid var(--gold)',
                  }}
                >
                  {step.icon}
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-body text-xs font-bold"
                    style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Card */}
                <div
                  className="w-full rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
                  style={{ backgroundColor: '#ffffff', border: '1px solid rgba(11,31,75,0.08)' }}
                >
                  <h3 className="font-display font-bold text-xl mb-3" style={{ color: 'var(--text-dark)' }}>
                    {step.title}
                  </h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA row */}
        <div className="text-center mt-16 reveal">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, var(--navy), var(--navy-light))',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(11,31,75,0.2)',
            }}
          >
            Ücretsiz Demo Başlat →
          </a>
        </div>
      </div>
    </section>
  )
}
