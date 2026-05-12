import { HTMLAttributes } from 'react'

type Variant = 'default' | 'elevated' | 'bordered'

interface SPCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  /** Tailwind border color class for `bordered` variant, e.g. `border-l-sp-electric` */
  accent?: string
}

const VARIANT: Record<Variant, string> = {
  default:  'bg-white border border-[var(--sp-border)] rounded-[10px]',
  elevated: 'bg-white rounded-[10px] shadow-[var(--sp-shadow-md)]',
  bordered: 'bg-white border-l-4 border border-[var(--sp-border)] rounded-[10px]',
}

export default function SPCard({
  variant = 'default',
  accent,
  className = '',
  children,
  ...rest
}: SPCardProps) {
  const base = VARIANT[variant]
  const accentCls = variant === 'bordered' ? (accent ?? 'border-l-sp-electric') : ''
  return (
    <div className={`${base} ${accentCls} ${className}`} {...rest}>
      {children}
    </div>
  )
}
