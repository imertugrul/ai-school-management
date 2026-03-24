'use client'

import { useEffect, useRef, useState } from 'react'

const FAQS = [
  {
    q: 'Verilerimiz güvende mi?',
    a: 'Evet. Tüm veriler Türkiye KVKK ve AB GDPR standartlarına uygun işlenir. Öğrenci kişisel bilgileri AI sistemlerine gönderilmez. Veriler Avrupa veri merkezlerinde şifreli saklanır.',
  },
  {
    q: 'Kaç öğretmen kullanabilir?',
    a: 'Tüm planlarda öğretmen sayısı sınırsızdır. Yalnızca aktif öğrenci sayısı ücretlendirmeyi etkiler.',
  },
  {
    q: 'Mevcut sistemimizden geçiş nasıl olur?',
    a: 'CSV import özelliğimiz ile öğrenci, öğretmen ve ders verilerinizi dakikalar içinde sisteme aktarabilirsiniz. Ücretsiz onboarding desteği sunuyoruz.',
  },
  {
    q: 'Hangi müfredatları destekliyorsunuz?',
    a: 'IB, AP, MEB (Türk Milli Eğitim), IGCSE (Cambridge) ve Common Core (ABD) desteklenmektedir.',
  },
  {
    q: 'Mobil uygulamanız var mı?',
    a: 'Web uygulamamız tüm cihazlarda responsive çalışır. iOS ve Android native uygulamamız 2026 Q3\'te yayına girecektir.',
  },
  {
    q: 'Destek nasıl alınıyor?',
    a: 'Email destek tüm planlarda mevcuttur. Okul planında 7/24 canlı destek sunulmaktadır.',
  },
]

export default function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null)
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
    <section id="faq" ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'rgba(11,31,75,0.05)', color: 'var(--navy)' }}>
            SSS
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl" style={{ color: 'var(--text-dark)' }}>
            Sıkça Sorulan Sorular
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`reveal reveal-delay-${(i % 4) + 1} rounded-2xl overflow-hidden transition-all duration-300`}
              style={{
                backgroundColor: '#ffffff',
                border: open === i ? '1.5px solid var(--gold)' : '1px solid rgba(11,31,75,0.08)',
                boxShadow: open === i ? '0 8px 32px rgba(11,31,75,0.08)' : 'none',
              }}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-body font-semibold text-base pr-4" style={{ color: 'var(--text-dark)' }}>
                  {faq.q}
                </span>
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-300"
                  style={{
                    backgroundColor: open === i ? 'var(--navy)' : 'rgba(11,31,75,0.06)',
                    color: open === i ? 'var(--gold)' : 'var(--navy)',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
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
