'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingTestimonials() {
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

  return (
    <section ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white">
            {t.testimonials.title}
          </h2>
        </div>

        {/* Cards — glassmorphism */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {t.testimonials.items.map((item, i) => (
            <div key={i}
              className={`reveal reveal-delay-${i + 1} flex flex-col justify-between p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1`}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}>
              {/* Stars */}
              <div>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: '#fbbf24', fontSize: '14px' }}>★</span>
                  ))}
                </div>
                <p className="font-body text-base leading-relaxed italic mb-6 text-white/90">
                  {item.text}
                </p>
              </div>
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0"
                  style={{ border: '2px solid rgba(255,255,255,0.3)' }}>
                  <Image src={item.avatar} alt={item.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-white">{item.name}</p>
                  <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
