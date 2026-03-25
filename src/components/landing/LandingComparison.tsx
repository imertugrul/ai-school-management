'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

const ROWS = [
  { feature: 'AI Lesson Planning',         school: true,   canvas: false,  google: false },
  { feature: '18 Question Types',           school: true,   canvas: 'partial', google: 'partial' },
  { feature: 'Auto AI Grading',             school: true,   canvas: false,  google: false },
  { feature: 'WhatsApp Notifications',      school: true,   canvas: false,  google: false },
  { feature: 'Monthly Parent Bulletin',     school: true,   canvas: false,  google: false },
  { feature: 'Social Media Hub',            school: true,   canvas: false,  google: false },
  { feature: 'Vice Principal Panel',        school: true,   canvas: 'partial', google: false },
  { feature: 'KVKK / GDPR Built-in',        school: true,   canvas: 'partial', google: 'partial' },
  { feature: 'Question Library',            school: true,   canvas: 'partial', google: false },
  { feature: 'Smart Conflict Detection',    school: true,   canvas: false,  google: false },
  { feature: 'Multi-language UI',           school: true,   canvas: true,   google: true },
  { feature: 'Setup Time',                  school: 'Minutes', canvas: 'Weeks', google: 'Days' },
]

function Cell({ value }: { value: boolean | 'partial' | string }) {
  if (value === true)      return <span className="text-xl">✅</span>
  if (value === false)     return <span className="text-xl">❌</span>
  if (value === 'partial') return <span className="text-xl">⚠️</span>
  return <span className="font-body text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
}

export default function LandingComparison() {
  const { t } = useLanguage()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const cmp = (t as any).comparison ?? {
    title: 'Why SchoolPro AI?',
    subtitle: 'See how we compare to traditional solutions',
    badge: 'Most Complete',
  }

  return (
    <section ref={ref} className="py-24 lg:py-32" style={{ backgroundColor: 'var(--white)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 font-body text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: 'var(--primary-pale)', color: 'var(--primary)' }}>
            ✦ {cmp.badge}
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4" style={{ color: 'var(--text)' }}>
            {cmp.title}
          </h2>
          <p className="font-body text-lg" style={{ color: 'var(--text-muted)' }}>
            {cmp.subtitle}
          </p>
        </div>

        {/* Table — horizontally scrollable on mobile */}
        <div className="reveal overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--gray-200)', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left px-6 py-4 font-body text-sm font-bold w-[42%]"
                  style={{ backgroundColor: '#F8FAFC', color: 'var(--text-muted)', borderBottom: '1px solid var(--gray-200)' }}>
                  Feature
                </th>
                {/* SchoolPro AI — highlighted column */}
                <th className="px-4 py-4 text-center font-body text-sm font-bold relative"
                  style={{ backgroundColor: 'var(--primary)', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#60A5FA', color: '#fff' }}>
                      ✦ {cmp.badge}
                    </span>
                    SchoolPro AI
                  </div>
                </th>
                <th className="px-4 py-4 text-center font-body text-sm font-bold"
                  style={{ backgroundColor: '#F8FAFC', color: 'var(--text-muted)', borderBottom: '1px solid var(--gray-200)' }}>
                  Canvas / Moodle
                </th>
                <th className="px-4 py-4 text-center font-body text-sm font-bold"
                  style={{ backgroundColor: '#F8FAFC', color: 'var(--text-muted)', borderBottom: '1px solid var(--gray-200)' }}>
                  Google Classroom
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i}
                  className="transition-colors duration-150"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#fff' : '#FAFBFC',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FB')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FAFBFC')}
                >
                  <td className="px-6 py-3.5 font-body text-sm font-medium"
                    style={{ color: 'var(--text)', borderBottom: i < ROWS.length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                    {row.feature}
                  </td>
                  <td className="px-4 py-3.5 text-center"
                    style={{ backgroundColor: 'rgba(30,58,95,0.04)', borderBottom: i < ROWS.length - 1 ? '1px solid rgba(30,58,95,0.08)' : 'none' }}>
                    <Cell value={row.school} />
                  </td>
                  <td className="px-4 py-3.5 text-center"
                    style={{ borderBottom: i < ROWS.length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                    <Cell value={row.canvas} />
                  </td>
                  <td className="px-4 py-3.5 text-center"
                    style={{ borderBottom: i < ROWS.length - 1 ? '1px solid var(--gray-200)' : 'none' }}>
                    <Cell value={row.google} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="reveal mt-6 flex flex-wrap justify-center gap-4 font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>✅ Fully supported</span>
          <span>⚠️ Partial / Manual</span>
          <span>❌ Not available</span>
        </div>
      </div>
    </section>
  )
}
