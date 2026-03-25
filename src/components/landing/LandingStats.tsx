'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

function useCountUp(target: number, decimal: boolean, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const steps = 60
    let current = 0
    const increment = target / steps
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(decimal ? Math.round(current * 10) / 10 : Math.floor(current))
      if (current >= target) clearInterval(timer)
    }, 1800 / steps)
    return () => clearInterval(timer)
  }, [active, target, decimal])
  return count
}

function StatItem({ value, suffix, labelKey, decimal, active }: { value: number; suffix: string; labelKey: string; decimal?: boolean; active: boolean }) {
  const count = useCountUp(value, !!decimal, active)
  return (
    <div className="text-center px-8 py-8">
      <div className="font-display font-bold text-5xl md:text-6xl text-white">
        {decimal ? count.toFixed(1) : count}{suffix}
      </div>
      <div className="font-body text-sm font-medium mt-2 tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.6)' }}>
        {labelKey}
      </div>
    </div>
  )
}

export default function LandingStats() {
  const { t } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stats = [
    { value: 240, suffix: '+',  label: t.stats.students },
    { value: 13,  suffix: '',   label: t.stats.teachers },
    { value: 40,  suffix: '+',  label: t.stats.courses },
    { value: 99.9, suffix: '%', label: t.stats.uptime, decimal: true },
  ]

  return (
    <section ref={ref} style={{ backgroundColor: 'var(--primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center md:justify-between items-center divide-y md:divide-y-0 md:divide-x"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          {stats.map((s, i) => (
            <div key={i} className="flex-1 min-w-[180px]">
              <StatItem value={s.value} suffix={s.suffix} labelKey={s.label} decimal={s.decimal} active={active} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
