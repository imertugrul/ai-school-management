'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

const TESTIMONIALS = [
  {
    text: '"AI ders planlayıcısı hayatımı değiştirdi. 2 saatlik işi 2 dakikada yapıyorum artık."',
    name: 'Mehmet Öztürk',
    role: 'Matematik Öğretmeni',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  },
  {
    text: '"Velilerle iletişim artık çok kolay. Devamsızlık bildirimleri otomatik gidiyor, telefona bakmak zorunda kalmıyorum."',
    name: 'Fatma Yıldız',
    role: 'Sınıf Öğretmeni',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
  },
  {
    text: '"18 farklı soru tipi ve AI puanlama sistemi gerçekten etkileyici. Sınav hazırlamak artık keyifli."',
    name: 'Kemal Arslan',
    role: 'Fizik Öğretmeni',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
  },
]

export default function LandingTestimonials() {
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
    <section ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>
            Referanslar
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl" style={{ color: '#ffffff' }}>
            Öğretmenler Ne Diyor?
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`reveal reveal-delay-${i + 1} flex flex-col justify-between p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
              }}
            >
              {/* Stars */}
              <div>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: 'var(--gold)' }}>⭐</span>)}
                </div>
                {/* Quote */}
                <p className="font-body text-base leading-relaxed italic mb-6" style={{ color: 'var(--text-dark)' }}>
                  {t.text}
                </p>
              </div>
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: '#f0f2f5' }}>
                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0"
                  style={{ border: '2px solid var(--gold-pale)' }}>
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-body font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{t.name}</p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
