'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ROLE_LABELS } from '@/lib/permissions'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const NAV_ITEMS = [
  { href: '/staff-panel',                   icon: '🏠', tKey: 'dashboard.staff.navHome'               },
  { href: '/staff-panel/attendance-review', icon: '📋', tKey: 'dashboard.staff.navAttendanceApproval', badgeKey: 'attendance' },
  { href: '/staff-panel/appointments',      icon: '🗓️', tKey: 'dashboard.staff.navAppointments',       badgeKey: 'appointments' },
  { href: '/staff-panel/students',          icon: '👥', tKey: 'dashboard.staff.navStudents'            },
  { href: '/staff-panel/announcements',     icon: '📢', tKey: 'dashboard.staff.navAnnouncements'       },
  { href: '/staff-panel/events',            icon: '📅', tKey: 'dashboard.staff.navEvents'              },
  { href: '/staff-panel/schedule',          icon: '🗓️', tKey: 'dashboard.staff.navSchedule'            },
  { href: '/staff-panel/analytics',         icon: '📊', tKey: 'dashboard.staff.navReports'             },
]

export default function StaffPanelLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router   = useRouter()
  const { t }    = useLanguage()

  const role      = (session?.user as { role?: string })?.role ?? ''
  const roleLabel = ROLE_LABELS[role] ?? role
  const initials  = (session?.user?.name ?? 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const [pendingCount, setPendingCount]         = useState(0)
  const [pendingApptCount, setPendingApptCount] = useState(0)

  useEffect(() => {
    function fetchPending() {
      fetch('/api/admin/absence-notifications?status=PENDING')
        .then(r => r.json())
        .then(d => setPendingCount(d.summary?.pending ?? 0))
        .catch(() => {})
      fetch('/api/staff/appointments?status=PENDING')
        .then(r => r.json())
        .then((d: unknown[]) => setPendingApptCount(Array.isArray(d) ? d.length : 0))
        .catch(() => {})
    }
    fetchPending()
    const interval = setInterval(fetchPending, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{t('dashboard.staff.panelTitle')}</p>
              <p className="text-xs text-gray-400">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = item.href === '/staff-panel'
              ? pathname === '/staff-panel'
              : pathname.startsWith(item.href)
            const badge = item.badgeKey === 'attendance' && pendingCount > 0
              ? pendingCount
              : item.badgeKey === 'appointments' && pendingApptCount > 0
              ? pendingApptCount
              : null
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 text-left">{t(item.tKey)}</span>
                {badge !== null && (
                  <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-semibold">{initials}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-400">{roleLabel}</p>
            </div>
          </div>
          <div className="mb-2">
            <LanguageSwitcher variant="full" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-xl transition-colors font-medium"
          >
            {t('dashboard.common.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
