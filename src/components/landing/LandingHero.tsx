'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function LandingHero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden hero-pattern"
      style={{ backgroundColor: 'var(--navy)' }}
    >
      {/* Decorative gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '-5%',
          top: '-15%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 45%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          left: '-10%',
          bottom: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,43,94,0.8) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Text ─────────────────────────────────────────────── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-body text-xs font-semibold tracking-widest uppercase"
              style={{ borderColor: 'rgba(201,168,76,0.4)', color: 'var(--gold)', backgroundColor: 'rgba(201,168,76,0.08)' }}>
              <span style={{ color: 'var(--gold)' }}>✦</span> Yapay Zeka Destekli Eğitim
            </div>

            {/* Headline */}
            <h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08]"
              style={{ color: '#ffffff' }}
            >
              Okulunuzu
              <br />
              <span className="text-gold-gradient">Geleceğe</span>
              <br />
              Taşıyın.
            </h1>

            {/* Subheadline */}
            <p className="font-body text-lg leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Yapay zeka ile ders planla, otomatik not ver, velilerle anlık iletişim kur.
              Tek platform, sonsuz imkan.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  color: 'var(--navy)',
                  boxShadow: '0 8px 32px rgba(201,168,76,0.35)',
                }}
              >
                Demo Talep Et <span>→</span>
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-xl text-base border transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
              >
                Sistemi İncele
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-5 pt-2">
              {[
                '✓ KVKK Uyumlu',
                '✓ 14 Günlük Ücretsiz Deneme',
                '✓ Kredi Kartı Gerekmez',
              ].map(item => (
                <span key={item} className="font-body text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ color: 'var(--gold)' }}>{item.slice(0, 1)}</span>{item.slice(1)}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Mockup ──────────────────────────────────────────── */}
          <div className="relative hidden lg:block h-[560px]">

            {/* Classroom background image */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{ transform: 'rotate(-1.5deg)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
            >
              <Image
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                alt="Sınıf ortamı"
                fill
                className="object-cover"
                style={{ filter: 'brightness(0.35)' }}
                priority
              />
              {/* UI overlay – main dashboard card */}
              <div className="absolute inset-4 rounded-2xl p-5 flex flex-col gap-4"
                style={{ backgroundColor: 'rgba(11,31,75,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-body text-white font-semibold text-sm">📊 Dashboard</span>
                  <span className="font-body text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: 'var(--gold)' }}>Canlı</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Öğrenci', value: '240', icon: '👨‍🎓' },
                    { label: 'Devam %', value: '94.2', icon: '📅' },
                    { label: 'Ders',    value: '42',   icon: '📚' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-lg mb-0.5">{s.icon}</div>
                      <div className="font-display font-bold text-xl" style={{ color: 'var(--gold)' }}>{s.value}</div>
                      <div className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Fake progress bars */}
                <div className="space-y-2.5 flex-1">
                  <p className="font-body text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Sınıf Performansı</p>
                  {[
                    { name: '10-A', pct: 88, color: '#22c55e' },
                    { name: '10-B', pct: 74, color: '#f59e0b' },
                    { name: '11-A', pct: 91, color: '#22c55e' },
                    { name: '11-B', pct: 62, color: '#ef4444' },
                  ].map(cls => (
                    <div key={cls.name} className="flex items-center gap-2">
                      <span className="font-body text-xs w-10" style={{ color: 'rgba(255,255,255,0.6)' }}>{cls.name}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${cls.pct}%`, backgroundColor: cls.color }} />
                      </div>
                      <span className="font-body text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>{cls.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating: AI Bülten card (top-left) */}
            <div
              className="absolute -left-6 top-8 rounded-2xl p-4 font-body shadow-2xl"
              style={{
                backgroundColor: 'rgba(11,31,75,0.95)',
                border: '1px solid rgba(201,168,76,0.3)',
                backdropFilter: 'blur(16px)',
                width: '200px',
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">✨</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>AI Bülten</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                3 bülten otomatik oluşturuldu ve velilere gönderildi.
              </p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
                ))}
              </div>
            </div>

            {/* Floating: Son Not card (bottom-right) */}
            <div
              className="absolute -right-6 bottom-12 rounded-2xl p-4 font-body shadow-2xl"
              style={{
                backgroundColor: '#ffffff',
                width: '190px',
                zIndex: 10,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--navy)' }}>Son Not</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>+2.1</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Matematik — 10-A</p>
              <p className="font-display text-3xl font-bold mt-1" style={{ color: 'var(--navy)' }}>87.5</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0f2f5' }}>
                <div className="h-full rounded-full" style={{ width: '87.5%', backgroundColor: '#22c55e' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--navy))' }} />
    </section>
  )
}
