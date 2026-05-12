import { ReactNode } from 'react'

export type SPStatColor = 'blue' | 'cyan' | 'indigo' | 'violet' | 'green' | 'amber' | 'red' | 'pink'

interface SPStatCardProps {
  icon:       ReactNode
  iconColor?: SPStatColor
  value:      ReactNode
  label:      string
  trend?:     { value: string; direction: 'up' | 'down' | 'flat' }
  onClick?:   () => void
  className?: string
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

export default function SPStatCard({
  icon, iconColor = 'blue', value, label, trend, onClick, className = '',
}: SPStatCardProps) {
  const interactive = onClick
    ? 'cursor-pointer hover:border-[var(--sp-electric)] hover:shadow-[var(--sp-shadow-md)]'
    : ''
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`block text-left w-full bg-white border border-[var(--sp-border)] rounded-[10px] p-4 transition-all ${interactive} ${className}`}
    >
      <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-base mb-3 ${ICON_THEME[iconColor]}`}>
        {icon}
      </div>
      <div className="text-[22px] leading-tight font-bold text-[var(--sp-text-primary)] tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--sp-text-muted)]">{label}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            trend.direction === 'up'
              ? 'bg-[var(--sp-green-bg)] text-[var(--sp-green-text)]'
              : trend.direction === 'down'
              ? 'bg-[var(--sp-red-bg)] text-[var(--sp-red-text)]'
              : 'bg-[var(--sp-bg)] text-[var(--sp-text-muted)]'
          }`}>
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '◆'}
            {trend.value}
          </span>
        )}
      </div>
    </Tag>
  )
}
