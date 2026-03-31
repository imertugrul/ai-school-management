'use client'

import { useEffect, useRef } from 'react'

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
    <section id="pricing" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--white)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            Fiyatlandırma
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            Okulunuza Özel Fiyat
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            Her okulun ihtiyacı farklıdır — size özel teklif hazırlayalım.
          </p>
        </div>

        {/* Single card */}
        <div className="max-w-2xl mx-auto reveal reveal-delay-1">
          <div className="rounded-3xl p-10 md:p-12 text-center"
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--gray-200)',
              boxShadow: '0 4px 32px rgba(15,23,42,0.08)',
            }}>
            <div className="text-5xl mb-6">💼</div>
            <h3 className="font-display font-bold text-2xl mb-4" style={{ color: 'var(--text)' }}>
              SchoolPro AI, okulunuzun ihtiyacına göre özel fiyatlandırma sunar.
            </h3>

            <ul className="space-y-3 text-left max-w-sm mx-auto mb-8">
              {[
                'Sınırsız öğretmen ve öğrenci',
                'Tüm AI özellikleri dahil',
                'Türkçe destek',
                'Kurulum ve eğitim dahil',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 font-body text-base"
                  style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✅</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="font-body text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Fiyat teklifi ve demo için:
            </p>

            <a href="#contact"
              className="inline-flex items-center gap-2 font-body font-bold px-8 py-4 rounded-xl text-white text-base transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 24px rgba(79,142,247,0.4)' }}>
              📞 İletişime Geçin
            </a>

            <p className="font-body text-xs mt-4" style={{ color: 'var(--text-light)' }}>
              Deneme sürümü mevcut
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
