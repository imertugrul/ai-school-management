'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 240, suffix: '+', label: 'Öğrenci' },
  { value: 13,  suffix: '',  label: 'Öğretmen' },
  { value: 40,  suffix: '+', label: 'Ders' },
  { value: 99.9, suffix: '%', label: 'Uptime', decimal: true },
]

function useCountUp(target: number, decimal: boolean, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const duration = 1800
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(decimal ? Math.round(current * 10) / 10 : Math.floor(current))
      if (current >= target) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [active, target, decimal])
  return count
}

function StatItem({ value, suffix, label, decimal, active }: { value: number; suffix: string; label: string; decimal?: boolean; active: boolean }) {
  const count = useCountUp(value, !!decimal, active)
  return (
    <div className="text-center px-8 py-6">
      <div className="font-display font-bold text-5xl md:text-6xl" style={{ color: 'var(--gold)' }}>
        {decimal ? count.toFixed(1) : count}{suffix}
      </div>
      <div className="font-body text-sm font-medium mt-2 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </div>
    </div>
  )
}

export default function LandingStats() {
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

  return (
    <section ref={ref} style={{ backgroundColor: 'var(--navy-dark)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center md:justify-between items-center divide-y md:divide-y-0 md:divide-x"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          {STATS.map(s => (
            <div key={s.label} className="flex-1 min-w-[180px]">
              <StatItem {...s} active={active} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
