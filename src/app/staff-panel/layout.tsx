'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import AppShell from '@/components/layout/AppShell'
import type { SidebarSection } from '@/components/layout/Sidebar'

export default function StaffPanelLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [pendingAppts,     setPendingAppts]     = useState(0)

  useEffect(() => {
    const fetchPending = () => {
      fetch('/api/admin/absence-notifications?status=PENDING')
        .then(r => r.json())
        .then(d => setPendingApprovals(d.summary?.pending ?? 0))
        .catch(() => {})
      fetch('/api/staff/appointments?status=PENDING')
        .then(r => r.json())
        .then((d: unknown[]) => setPendingAppts(Array.isArray(d) ? d.length : 0))
        .catch(() => {})
    }
    fetchPending()
    const i = setInterval(fetchPending, 60_000)
    return () => clearInterval(i)
  }, [])

  const sections: SidebarSection[] = [
    {
      headerKey: 'dashboard.staff.sectionMain',
      items: [
        { href: '/staff-panel', icon: '🏠', labelKey: 'dashboard.staff.navHome', exact: true },
      ],
    },
    {
      headerKey: 'dashboard.staff.sectionWork',
      items: [
        { href: '/staff-panel/attendance-review', icon: '✅', labelKey: 'dashboard.staff.navAttendanceApproval', badge: pendingApprovals },
        { href: '/staff-panel/appointments',      icon: '🗓️', labelKey: 'dashboard.staff.navAppointments',       badge: pendingAppts     },
        { href: '/staff-panel/students',          icon: '👥', labelKey: 'dashboard.staff.navStudents'                                    },
        { href: '/staff-panel/announcements',     icon: '📢', labelKey: 'dashboard.staff.navAnnouncements'                                },
        { href: '/staff-panel/events',            icon: '📅', labelKey: 'dashboard.staff.navEvents'                                       },
        { href: '/staff-panel/schedule',          icon: '🗒️', labelKey: 'dashboard.staff.navSchedule'                                    },
        { href: '/staff-panel/analytics',         icon: '📊', labelKey: 'dashboard.staff.navReports'                                      },
      ],
    },
  ]

  return (
    <AppShell
      roleLabel={t('dashboard.staff.roleLabel')}
      sections={sections}
      mobileTitle={t('dashboard.staff.panelTitle')}
    >
      {children}
    </AppShell>
  )
}
