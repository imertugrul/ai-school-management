'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function LandingSocialHub() {
  const { t } = useLanguage()
  const ref = useRef<HTMLElement>(null)
  const [activePlatform, setActivePlatform] = useState(0)

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

  // Cycle through platforms every 1.5s
  useEffect(() => {
    const timer = setInterval(() => setActivePlatform(p => (p + 1) % 5), 1500)
    return () => clearInterval(timer)
  }, [])

  const platforms = [
    { label: 'Instagram', icon: '📸', color: '#E1306C' },
    { label: 'Twitter',   icon: '𝕏',  color: '#14141F' },
    { label: 'LinkedIn',  icon: '💼', color: '#0A66C2' },
    { label: 'Facebook',  icon: '👥', color: '#1877F2' },
    { label: 'TikTok',    icon: '🎵', color: '#010101' },
  ]

  const sh = (t as any).socialHub ?? {
    badge: '✦ Not Available in Competitors',
    title: 'Manage Your School\'s\nSocial Media\nwith AI',
    subtitle: 'Create AI-powered content for Instagram, Twitter, LinkedIn, Facebook and TikTok in one click.',
    features: ['Generate content for 5 platforms at once','School brand voice & tone settings','Content calendar & scheduling','GDPR-safe content','Ready-made templates','Optimised format for each platform'],
    cta: 'Learn More →',
    mockCaption: 'We came first in the Math Olympiad! We are proud of our students.',
    mockHandle: '@schoolproai',
    mockScheduled: 'Scheduled: Tomorrow 12:00',
    mockAiBadge: '✨ Created with AI',
  }

  const titleLines = sh.title.split('\n')

  return (
    <section ref={ref} className="py-24 lg:py-32 overflow-hidden" style={{ backgroundColor: 'var(--primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Text ── */}
          <div className="space-y-6 reveal">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body text-xs font-bold"
              style={{ backgroundColor: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', color: '#FCD34D' }}>
              {sh.badge}
            </div>

            {/* Title */}
            <h2 className="font-display font-bold leading-[1.1] text-white"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', letterSpacing: '-0.02em' }}>
              {titleLines.map((line: string, i: number) => (
                <span key={i}>
                  {i === 1 ? <span style={{ color: '#60A5FA' }}>{line}</span> : line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>

            {/* Subtitle */}
            <p className="font-body text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '440px' }}>
              {sh.subtitle}
            </p>

            {/* Feature list */}
            <ul className="space-y-2.5">
              {sh.features.map((feat: string, i: number) => (
                <li key={i} className="flex items-center gap-3 font-body text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: 'rgba(96,165,250,0.2)', color: '#60A5FA' }}>
                    ✓
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a href="/features/social-media"
              className="inline-flex items-center gap-2 font-body font-semibold px-6 py-3 rounded-full transition-all hover:scale-105 text-sm"
              style={{ backgroundColor: '#60A5FA', color: '#fff', boxShadow: '0 4px 20px rgba(96,165,250,0.35)' }}>
              {sh.cta}
            </a>
          </div>

          {/* ── Right: Animated mockup card ── */}
          <div className="flex justify-center reveal reveal-delay-2">
            <div className="relative w-full max-w-sm">
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
                style={{ backgroundColor: '#60A5FA', transform: 'scale(0.85)' }} />

              {/* Post card */}
              <div className="relative rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(20px)',
                }}>
                {/* AI badge */}
                <div className="px-5 pt-5 pb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#FCD34D', border: '1px solid rgba(251,191,36,0.25)' }}>
                    {sh.mockAiBadge}
                  </div>
                </div>

                {/* Profile row */}
                <div className="px-5 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: 'rgba(79,142,247,0.3)', color: '#93C5FD' }}>
                    🏫
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">SchoolPro AI</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{sh.mockHandle}</p>
                  </div>
                </div>

                {/* Caption */}
                <div className="px-5 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    🎓 {sh.mockCaption} 🏆
                  </p>
                </div>

                {/* Hashtags */}
                <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                  {['#education', '#success', '#achievement'].map(tag => (
                    <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#93C5FD' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Platform icons */}
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-2">
                    {platforms.map((p, i) => (
                      <div key={i}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500"
                        style={{
                          backgroundColor: i === activePlatform ? p.color : 'rgba(255,255,255,0.08)',
                          transform: i === activePlatform ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: i === activePlatform ? `0 0 12px ${p.color}66` : 'none',
                        }}>
                        {p.icon}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled row */}
                <div className="mx-5 mb-5 px-4 py-3 rounded-2xl flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="text-green-400 font-bold text-sm">✓</span>
                  <span className="text-sm font-medium" style={{ color: '#6EE7B7' }}>{sh.mockScheduled}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
