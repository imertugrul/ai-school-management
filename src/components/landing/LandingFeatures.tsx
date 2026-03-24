'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

const FEATURES = [
  {
    icon: '✦',
    title: '2 Dakikada Profesyonel Ders Planı',
    desc: 'GPT-4 destekli sistemimiz, müfredata uygun ders planlarını saniyeler içinde hazırlar. IB, AP, MEB, IGCSE destekli.',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700',
    imageAlt: 'Öğretmen bilgisayar başında',
    tag: 'AI Ders Planı',
  },
  {
    icon: '📊',
    title: '18 Farklı Soru Tipiyle Değerlendirme',
    desc: 'Çoktan seçmeli, açık uçlu, eşleştirme, sürükle-bırak ve daha fazlası. AI otomatik puanlar, öğretmen onaylar.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700',
    imageAlt: 'Öğrenci sınav yapıyor',
    tag: 'Akıllı Not Sistemi',
  },
  {
    icon: '💬',
    title: 'Velilerle Anlık, Otomatik İletişim',
    desc: 'Devamsızlık bildirimleri WhatsApp ve email ile anında gider. Aylık performans bültenleri otomatik oluşturulur ve gönderilir.',
    image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=700',
    imageAlt: 'Telefon kullanan yetişkin',
    tag: 'Veli İletişimi',
  },
  {
    icon: '📈',
    title: 'Veriye Dayalı Kararlar Alın',
    desc: 'Okul geneli performans analizi, risk altındaki öğrenci tespiti, öğretmen etkinlik raporları tek ekranda.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700',
    imageAlt: 'Analytics dashboard',
    tag: 'Analitik Dashboard',
  },
]

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.15 }
    )
    el.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [ref])
}

export default function LandingFeatures() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  return (
    <section id="features" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'rgba(11,31,75,0.05)', color: 'var(--navy)' }}>
            Modüller
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text-dark)' }}>
            Her İhtiyacınız İçin Bir Çözüm
          </h2>
          <p className="font-body text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Okulunuzun tüm süreçlerini tek çatı altında yönetin
          </p>
        </div>

        {/* Feature rows */}
        <div className="space-y-24">
          {FEATURES.map((f, i) => {
            const isEven = i % 2 === 0
            return (
              <div key={f.title} className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center reveal reveal-delay-${(i % 4) + 1}`}>
                {/* Text */}
                <div className={`space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: 'var(--navy)' }}>
                    <span style={{ color: 'var(--gold)', fontSize: '1rem' }}>{f.icon}</span>
                    {f.tag}
                  </div>
                  <h3 className="font-display font-bold text-3xl md:text-4xl leading-tight" style={{ color: 'var(--text-dark)' }}>
                    {f.title}
                  </h3>
                  <p className="font-body text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {f.desc}
                  </p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 font-body text-sm font-semibold transition-all hover:gap-3"
                    style={{ color: 'var(--navy)' }}
                  >
                    Daha Fazla Bilgi →
                  </a>
                </div>
                {/* Image */}
                <div className={`relative h-72 md:h-96 rounded-3xl overflow-hidden shadow-2xl ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                  style={{ transform: isEven ? 'rotate(1deg)' : 'rotate(-1deg)' }}>
                  <Image
                    src={f.image}
                    alt={f.imageAlt}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(11,31,75,0.3) 0%, transparent 60%)' }} />
                  {/* Tag overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl font-body text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(11,31,75,0.85)', color: 'var(--gold)', backdropFilter: 'blur(8px)' }}>
                    {f.tag}
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
