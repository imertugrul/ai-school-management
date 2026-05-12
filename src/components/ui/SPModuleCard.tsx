'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { SPStatColor } from './SPStatCard'

interface SPModuleCardProps {
  icon:        ReactNode
  iconColor?:  SPStatColor
  title:       string
  description: string
  href?:       string
  onClick?:    () => void
  badge?:      ReactNode
}

const ICON_THEME: Record<SPStatColor, string> = {
  blue:   'bg-[var(--sp-blue-bg)]   text-[var(--sp-blue-text)]',
  cyan:   'bg-[var(--sp-cyan-bg)]   text-[var(--sp-cyan-text)]',
  indigo: 'bg-[var(--sp-indigo-bg)] text-[var(--sp-indigo-text)]',
  violet: 'bg-[var(--sp-violet-bg)] text-[var(--sp-violet-text)]',
  green:  'bg-[var(--sp-green-bg)]  text-[var(--sp-green-text)]',
  amber:  'bg-[var(--sp-amber-bg)]  text-[var(--sp-amber-text)]',
  red:    'bg-[var(--sp-red-bg)]    text-[var(--sp-red-text)]',
  pink:   'bg-[var(--sp-pink-bg)]   text-[var(--sp-pink-text)]',
}

export default function SPModuleCard({
  icon, iconColor = 'blue', title, description, href, onClick, badge,
}: SPModuleCardProps) {
  const router = useRouter()
  const handleClick = () => {
    if (onClick) onClick()
    else if (href) router.push(href)
  }
  return (
    <button
      onClick={handleClick}
      className="group w-full text-left bg-white border border-[var(--sp-border)] rounded-[12px] p-5 transition-all hover:border-[var(--sp-electric)] hover:shadow-[var(--sp-shadow-focus)] focus:outline-none focus:border-[var(--sp-electric)] focus:shadow-[var(--sp-shadow-focus)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center text-lg ${ICON_THEME[iconColor]}`}>
          {icon}
        </div>
        {badge}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[var(--sp-text-primary)] leading-snug">{title}</h3>
          <p className="text-[13px] text-[var(--sp-text-secondary)] mt-1 leading-relaxed line-clamp-2">{description}</p>
        </div>
        <span className="text-[var(--sp-text-muted)] group-hover:text-[var(--sp-electric)] transition-colors text-lg shrink-0 mt-0.5">→</span>
      </div>
    </button>
  )
}
