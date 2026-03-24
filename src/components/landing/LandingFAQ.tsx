'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingFAQ() {
  const { t } = useLanguage()
  const [open, setOpen] = useState<number | null>(0)
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

  return (
    <section id="faq" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--gray-50)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            SSS
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl" style={{ color: 'var(--text)' }}>
            {t.faq.title}
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {t.faq.items.map((faq, i) => (
            <div key={i}
              className={`reveal reveal-delay-${(i % 4) + 1} rounded-2xl overflow-hidden transition-all duration-200`}
              style={{
                backgroundColor: '#fff',
                border: open === i ? '1px solid rgba(79,142,247,0.25)' : '1px solid var(--gray-200)',
                borderLeft: open === i ? '4px solid var(--accent)' : '4px solid transparent',
                boxShadow: open === i ? '0 4px 24px rgba(79,142,247,0.08)' : 'none',
              } as React.CSSProperties}>
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-body font-semibold text-sm pr-4" style={{ color: 'var(--text)' }}>
                  {faq.q}
                </span>
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-300"
                  style={{
                    backgroundColor: open === i ? 'var(--accent)' : 'var(--primary-pale)',
                    color: open === i ? '#fff' : 'var(--primary)',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}>
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
