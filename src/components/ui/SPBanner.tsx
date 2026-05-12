import { HTMLAttributes, ReactNode } from 'react'

type Tone = 'info' | 'success' | 'warning' | 'error'

interface SPBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?:   Tone
  icon?:   ReactNode
  title?:  ReactNode
  action?: ReactNode
}

const TONE: Record<Tone, { wrap: string; icon: string }> = {
  info:    { wrap: 'bg-[var(--sp-blue-bg)]  border-l-4 border-[var(--sp-blue-text)]  text-[var(--sp-blue-text)]',   icon: 'ℹ️' },
  success: { wrap: 'bg-[var(--sp-green-bg)] border-l-4 border-[var(--sp-green-text)] text-[var(--sp-green-text)]',  icon: '✓' },
  warning: { wrap: 'bg-[var(--sp-amber-bg)] border-l-4 border-[var(--sp-amber-text)] text-[var(--sp-amber-text)]',  icon: '⚠' },
  error:   { wrap: 'bg-[var(--sp-red-bg)]   border-l-4 border-[var(--sp-red-text)]   text-[var(--sp-red-text)]',    icon: '⚠' },
}

export default function SPBanner({
  tone = 'info', icon, title, action, className = '', children, ...rest
}: SPBannerProps) {
  const theme = TONE[tone]
  return (
    <div
      className={`flex items-start gap-3 ${theme.wrap} rounded-[10px] px-4 py-3 ${className}`}
      {...rest}
    >
      <span className="shrink-0 text-base mt-0.5">{icon ?? theme.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-[13px] leading-tight">{title}</p>}
        {children && <div className="text-[12px] mt-0.5 leading-relaxed opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
