'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const ICONS = ['🏫', '⚙️', '🚀']

export default function LandingHowItWorks() {
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

  const steps = [
    { num: 1, icon: ICONS[0], title: t.how.s1title, desc: t.how.s1desc },
    { num: 2, icon: ICONS[1], title: t.how.s2title, desc: t.how.s2desc },
    { num: 3, icon: ICONS[2], title: t.how.s3title, desc: t.how.s3desc },
  ]

  return (
    <section id="how-it-works" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--gray-50)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            Süreç
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            {t.how.title}
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            {t.how.subtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-0.5"
            style={{ backgroundColor: 'var(--accent)', opacity: 0.3 }} />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, i) => (
              <div key={step.num}
                className={`reveal reveal-delay-${i + 1} group flex flex-col items-center text-center`}>
                {/* Circle */}
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-6 z-10 transition-all duration-300 group-hover:-translate-y-2"
                  style={{
                    backgroundColor: 'var(--primary-pale)',
                    border: '2px solid rgba(79,142,247,0.3)',
                    boxShadow: '0 4px 20px rgba(79,142,247,0.15)',
                  }}
                >
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-body text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--accent)' }}>
                    {step.num}
                  </div>
                </div>
                {/* Card */}
                <div className="w-full rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                  style={{ backgroundColor: '#fff', border: '1px solid var(--gray-200)' }}>
                  <h3 className="font-display font-bold text-xl mb-3" style={{ color: 'var(--text)' }}>
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

        {/* CTA */}
        <div className="text-center mt-16 reveal">
          <a href="#contact"
            className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full text-white text-base transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 24px rgba(79,142,247,0.4)' }}>
            {t.how.cta}
          </a>
        </div>
      </div>
    </section>
  )
}
