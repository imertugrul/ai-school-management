'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

const FEATURES = [
  { icon: '✦', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700', href: '/features/ai-planner',    tagKey: 'f1tag', titleKey: 'f1title', descKey: 'f1desc' },
  { icon: '📊', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700', href: '/features/test-system',   tagKey: 'f2tag', titleKey: 'f2title', descKey: 'f2desc' },
  { icon: '💬', img: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=700', href: '/features/communication', tagKey: 'f3tag', titleKey: 'f3title', descKey: 'f3desc' },
  { icon: '📈', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700', href: '/features/analytics',      tagKey: 'f4tag', titleKey: 'f4title', descKey: 'f4desc' },
] as const

export default function LandingFeatures() {
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
    <section id="features" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--white)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            Modüller
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            {t.features.title}
          </h2>
          <p className="font-body text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            {t.features.subtitle}
          </p>
        </div>

        {/* Feature rows */}
        <div className="space-y-24">
          {FEATURES.map((f, i) => {
            const isEven = i % 2 === 0
            const bg = i % 2 === 0 ? 'var(--white)' : 'var(--gray-50)'
            const tag   = t.features[f.tagKey]   ?? ''
            const title = t.features[f.titleKey] ?? ''
            const desc  = t.features[f.descKey]  ?? ''
            return (
              <div key={f.href}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center reveal reveal-delay-${(i % 4) + 1}`}
                style={{ backgroundColor: bg, padding: i % 2 !== 0 ? '48px 40px' : 0, borderRadius: i % 2 !== 0 ? '24px' : 0 }}>
                {/* Text */}
                <div className={`space-y-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
                    style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
                    <span style={{ color: 'var(--accent)' }}>{f.icon}</span> {tag}
                  </div>
                  <h3 className="font-display font-bold text-3xl md:text-4xl leading-tight"
                    style={{ color: 'var(--text)' }}>
                    {title}
                  </h3>
                  <p className="font-body text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {desc}
                  </p>
                  <a href={f.href}
                    className="inline-flex items-center gap-1.5 font-body text-sm font-semibold transition-all hover:gap-3"
                    style={{ color: 'var(--accent)' }}>
                    {t.features.more}
                  </a>
                </div>
                {/* Image */}
                <div className={`relative h-72 md:h-[380px] rounded-2xl overflow-hidden shadow-xl ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <Image src={f.img} alt={tag} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(30,58,95,0.25) 0%, transparent 60%)' }} />
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl font-body text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--primary)', backdropFilter: 'blur(8px)' }}>
                    {tag}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
