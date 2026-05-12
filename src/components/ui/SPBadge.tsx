import { HTMLAttributes } from 'react'

type Color = 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'gray' | 'violet'

interface SPBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: Color
}

const COLOR: Record<Color, string> = {
  blue:   'bg-[var(--sp-blue-bg)]   text-[var(--sp-blue-text)]',
  cyan:   'bg-[var(--sp-cyan-bg)]   text-[var(--sp-cyan-text)]',
  green:  'bg-[var(--sp-green-bg)]  text-[var(--sp-green-text)]',
  amber:  'bg-[var(--sp-amber-bg)]  text-[var(--sp-amber-text)]',
  red:    'bg-[var(--sp-red-bg)]    text-[var(--sp-red-text)]',
  gray:   'bg-[var(--sp-bg)]        text-[var(--sp-text-secondary)]',
  violet: 'bg-[var(--sp-violet-bg)] text-[var(--sp-violet-text)]',
}

export default function SPBadge({ color = 'gray', className = '', children, ...rest }: SPBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${COLOR[color]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
