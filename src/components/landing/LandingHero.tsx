'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function LandingHero() {
  const { t } = useLanguage()
  const titleLines = t.hero.title.split('\n')

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
      style={{ background: 'var(--bg-hero)' }}
    >
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--gray-200) 1px, transparent 1px), linear-gradient(90deg, var(--gray-200) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.35,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-body text-sm font-semibold"
          style={{
            backgroundColor: 'rgba(79,142,247,0.1)',
            border: '1px solid rgba(79,142,247,0.3)',
            color: 'var(--primary)',
            backdropFilter: 'blur(8px)',
          }}>
          {t.hero.badge}
        </div>

        {/* Headline */}
        <h1
          className="font-display font-bold leading-[1.1] mb-6"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', letterSpacing: '-0.02em', color: 'var(--text)' }}
        >
          {titleLines.map((line, i) => (
            <span key={i}>
              {i === 1 ? <span className="text-accent-gradient">{line}</span> : line}
              {i < titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p className="font-body text-lg md:text-xl leading-relaxed mx-auto mb-10"
          style={{ color: 'var(--text-muted)', maxWidth: '520px' }}>
          {t.hero.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <a href="#contact"
            className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full text-white text-base transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 24px rgba(79,142,247,0.4)' }}>
            {t.hero.cta} <span>→</span>
          </a>
          <a href="#features"
            className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full text-base border transition-all hover:bg-gray-50"
            style={{ borderColor: 'var(--gray-200)', color: 'var(--text)' }}>
            {t.hero.ctaSecondary}
          </a>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6">
          {[t.hero.trust1, t.hero.trust2, t.hero.trust3, t.hero.trust4].map(item => (
            <span key={item} className="flex items-center gap-1.5 font-body text-sm"
              style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── App Mockup Card ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div
          className="mockup-animate rounded-t-2xl overflow-hidden mx-auto"
          style={{
            backgroundColor: '#fff',
            boxShadow: '0 -4px 80px rgba(15,23,42,0.15), 0 0 0 1px rgba(15,23,42,0.06)',
            maxWidth: '760px',
            transform: 'perspective(1200px) rotateX(4deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* Mockup window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b"
            style={{ backgroundColor: 'var(--gray-50)', borderColor: 'var(--gray-200)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fc5f57' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
            <div className="flex-1 mx-4 h-5 rounded-md" style={{ backgroundColor: 'var(--gray-200)' }} />
          </div>
          {/* Mockup body */}
          <div className="flex h-52">
            {/* Sidebar */}
            <div className="w-16 border-r py-4 px-2 space-y-2 shrink-0"
              style={{ backgroundColor: 'var(--primary)', borderColor: 'rgba(255,255,255,0.1)' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-7 rounded-lg"
                  style={{ backgroundColor: i === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            {/* Main content */}
            <div className="flex-1 p-4 space-y-3" style={{ backgroundColor: 'var(--gray-50)' }}>
              {/* Top bar */}
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 rounded w-32" style={{ backgroundColor: 'var(--gray-200)' }} />
                <div className="h-6 w-20 rounded-full" style={{ backgroundColor: 'rgba(79,142,247,0.15)' }} />
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '240', sub: 'Öğrenci', color: 'rgba(79,142,247,0.12)' },
                  { label: '94%', sub: 'Devam', color: 'rgba(16,185,129,0.12)' },
                  { label: '42',  sub: 'Ders',  color: 'rgba(139,92,246,0.12)' },
                  { label: '13',  sub: 'Öğretmen', color: 'rgba(245,158,11,0.12)' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: s.color }}>
                    <div className="font-display font-bold text-sm" style={{ color: 'var(--primary)' }}>{s.label}</div>
                    <div className="font-body text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              {/* Chart rows */}
              <div className="space-y-2">
                {[
                  { w: '88%', color: 'var(--accent)' },
                  { w: '72%', color: '#10b981' },
                  { w: '91%', color: '#818cf8' },
                ].map((bar, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-2.5 rounded" style={{ backgroundColor: 'var(--gray-200)' }} />
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gray-200)' }}>
                      <div className="h-full rounded-full" style={{ width: bar.w, backgroundColor: bar.color }} />
                    </div>
                    <div className="w-6 h-2.5 rounded" style={{ backgroundColor: 'var(--gray-200)' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
