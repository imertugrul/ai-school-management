'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useSidebar } from './SidebarContext'

export interface SidebarItem {
  href:      string
  icon:      string
  /** i18n key for the label */
  labelKey:  string
  /** Optional numeric badge */
  badge?:    number
  /** When true, the active match is exact (===); otherwise startsWith */
  exact?:    boolean
}

export interface SidebarSection {
  /** Optional section header label (i18n key) — only shown in expanded state */
  headerKey?: string
  items:      SidebarItem[]
}

interface SidebarProps {
  /** Role label / subtitle shown beneath app name */
  roleLabel?: string
  /** Sidebar sections */
  sections:   SidebarSection[]
}

export default function Sidebar({ roleLabel, sections }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router   = useRouter()
  const { t } = useLanguage()
  const { mobileOpen, closeMobile } = useSidebar()

  const [hovered, setHovered] = useState(false)
  // Desktop expanded when hovered. Mobile: always shows full (overlay).
  const desktopExpanded = hovered

  const userName = session?.user?.name ?? '—'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const isActive = (item: SidebarItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')

  const navigate = (href: string) => {
    router.push(href)
    closeMobile()
  }

  // ── Reusable inner content (used by both desktop sidebar and mobile drawer)
  const Inner = ({ expanded }: { expanded: boolean }) => (
    <div className="sp-sidebar h-full flex flex-col bg-[var(--sp-sidebar-bg)] text-[var(--sp-sidebar-text)]">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-[var(--sp-sidebar-border)] ${expanded ? '' : 'justify-center'}`}>
        <div className="w-8 h-8 shrink-0 rounded-[8px] bg-gradient-to-br from-[var(--sp-electric)] to-[var(--sp-cyan)] flex items-center justify-center font-bold text-white text-sm">
          S
        </div>
        <div className={`overflow-hidden transition-[width,opacity] duration-200 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          <p className="text-[13px] font-semibold text-white whitespace-nowrap leading-tight">SchoolPro AI</p>
          {roleLabel && (
            <p className="text-[11px] text-[var(--sp-neutral)] whitespace-nowrap">{roleLabel}</p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="px-2">
            {expanded && section.headerKey && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sp-neutral)]/60">
                {t(section.headerKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item)
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => navigate(item.href)}
                      className={`group relative w-full flex items-center gap-3 h-9 rounded-[8px] transition-colors ${
                        expanded ? 'px-3' : 'px-0 justify-center'
                      } ${
                        active
                          ? 'text-[var(--sp-sidebar-active-text)] bg-[var(--sp-sidebar-active-bg)]'
                          : 'hover:bg-[var(--sp-sidebar-hover-bg)] hover:text-white'
                      }`}
                      title={!expanded ? t(item.labelKey) : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[var(--sp-electric)]" />
                      )}
                      <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
                      <span className={`flex-1 text-left text-[13px] font-medium whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200 ${
                        expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                      }`}>
                        {t(item.labelKey)}
                      </span>
                      {item.badge != null && item.badge > 0 && (
                        <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[var(--sp-electric)] text-white ${
                          expanded ? 'mr-1' : 'absolute top-1 right-1'
                        }`}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-[var(--sp-sidebar-border)] ${expanded ? 'p-3 space-y-3' : 'p-2 space-y-2'}`}>
        {expanded && (
          <div className="px-1">
            <LanguageSwitcher variant="full" />
          </div>
        )}
        <div className={`flex items-center gap-2 ${expanded ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--sp-electric)] to-[var(--sp-cyan)] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-semibold">{initials}</span>
          </div>
          <div className={`flex-1 min-w-0 overflow-hidden transition-[width,opacity] duration-200 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <p className="text-[12px] font-medium text-white truncate">{userName}</p>
            {roleLabel && <p className="text-[10px] text-[var(--sp-neutral)] truncate">{roleLabel}</p>}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={`w-full flex items-center gap-2 text-[12px] text-[var(--sp-neutral)] hover:text-[#FCA5A5] transition-colors ${
            expanded ? 'px-2 py-1.5' : 'justify-center py-1.5'
          }`}
          title={!expanded ? t('dashboard.common.signOut') : undefined}
        >
          <span>⎋</span>
          <span className={`whitespace-nowrap overflow-hidden transition-[opacity,width] duration-200 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            {t('dashboard.common.signOut')}
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop collapsible sidebar (hover-expand) ─────────────────── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: desktopExpanded ? 224 : 56 }}
        className="hidden md:flex shrink-0 transition-[width] duration-250 ease-in-out z-30"
      >
        <Inner expanded={desktopExpanded} />
      </aside>

      {/* ── Mobile overlay drawer ───────────────────────────────────────── */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        {/* Scrim */}
        <div
          onClick={closeMobile}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Drawer */}
        <aside
          className={`absolute inset-y-0 left-0 w-[280px] shadow-xl transition-transform duration-250 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Inner expanded={true} />
        </aside>
      </div>
    </>
  )
}
