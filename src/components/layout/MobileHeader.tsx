'use client'

import { ReactNode } from 'react'
import { useSidebar } from './SidebarContext'

interface MobileHeaderProps {
  title?:  string
  action?: ReactNode
}

export default function MobileHeader({ title, action }: MobileHeaderProps) {
  const { toggleMobile } = useSidebar()
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 h-12 px-3 bg-white border-b border-[var(--sp-border)]">
      <button
        onClick={toggleMobile}
        aria-label="Open menu"
        className="w-9 h-9 rounded-[8px] hover:bg-[var(--sp-surface-hover)] flex items-center justify-center text-[var(--sp-text-secondary)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3"  y1="6"  x2="21" y2="6" />
          <line x1="3"  y1="12" x2="21" y2="12" />
          <line x1="3"  y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-[var(--sp-text-primary)] truncate">{title}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </header>
  )
}
