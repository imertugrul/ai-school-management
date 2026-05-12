import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface SPButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  icon?:    ReactNode
}

const VARIANT: Record<Variant, string> = {
  primary:   'bg-[var(--sp-electric)] text-white border border-[var(--sp-electric)] hover:bg-[#2563EB] hover:border-[#2563EB]',
  secondary: 'bg-white text-[var(--sp-text-secondary)] border border-[var(--sp-border)] hover:bg-[var(--sp-surface-hover)] hover:text-[var(--sp-text-primary)]',
  ghost:     'bg-transparent text-[var(--sp-text-secondary)] border border-transparent hover:bg-[var(--sp-surface-hover)] hover:text-[var(--sp-text-primary)]',
  danger:    'bg-[var(--sp-red-text)] text-white border border-[var(--sp-red-text)] hover:bg-[#B91C1C] hover:border-[#B91C1C]',
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
}

export default function SPButton({
  variant = 'primary',
  size    = 'md',
  icon,
  className = '',
  children,
  ...rest
}: SPButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-[8px] transition-colors focus:outline-none focus:shadow-[var(--sp-shadow-focus)] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
