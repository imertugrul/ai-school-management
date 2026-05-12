'use client'

import { ChildProvider, useChild } from '@/context/ChildContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useSession } from 'next-auth/react'
import AppShell from '@/components/layout/AppShell'
import type { SidebarSection } from '@/components/layout/Sidebar'

function ChildSelectorBar() {
  const { children: childList, selectedChild, setSelectedChildId, loading } = useChild()
  if (loading || childList.length === 0) return null
  return (
    <div className="sticky top-0 md:top-0 z-30 bg-white border-b border-[var(--sp-border)] px-4 md:px-6 py-2 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--sp-text-muted)] hidden sm:inline">
        Öğrenci
      </span>
      {childList.length === 1 ? (
        <div className="text-sm font-semibold text-[var(--sp-text-primary)]">
          {selectedChild?.name}
          <span className="ml-2 text-xs font-normal text-[var(--sp-text-muted)]">{selectedChild?.className}</span>
        </div>
      ) : (
        <select
          value={selectedChild?.id ?? ''}
          onChange={e => setSelectedChildId(e.target.value)}
          className="sp-input max-w-[260px]"
        >
          {childList.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.className})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function ParentLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  useSession()

  const sections: SidebarSection[] = [
    {
      items: [
        { href: '/parent/dashboard',  icon: '🏠', labelKey: 'dashboard.parent.navHome',       exact: true },
        { href: '/parent/grades',     icon: '📊', labelKey: 'dashboard.parent.navGrades'                   },
        { href: '/parent/attendance', icon: '📅', labelKey: 'dashboard.parent.navAttendance'              },
        { href: '/parent/bulletins',  icon: '📨', labelKey: 'dashboard.parent.bulletinsTitle'             },
        { href: '/parent/announcements', icon: '📢', labelKey: 'dashboard.parent.announcementsTitle'      },
        { href: '/parent/chat',       icon: '🤖', labelKey: 'dashboard.parent.navAI'                       },
        { href: '/parent/profile',    icon: '👤', labelKey: 'dashboard.parent.navProfile'                  },
      ],
    },
  ]

  return (
    <AppShell
      roleLabel={t('dashboard.parent.roleLabel')}
      sections={sections}
      mobileTitle={t('dashboard.parent.portalTitle')}
    >
      <ChildSelectorBar />
      <div className="p-4 md:p-6">
        {children}
      </div>
    </AppShell>
  )
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChildProvider>
      <ParentLayoutInner>{children}</ParentLayoutInner>
    </ChildProvider>
  )
}
