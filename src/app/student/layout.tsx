'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import AppShell from '@/components/layout/AppShell'
import type { SidebarSection } from '@/components/layout/Sidebar'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()

  const sections: SidebarSection[] = [
    {
      headerKey: 'dashboard.student.sectionMain',
      items: [
        { href: '/student/dashboard', icon: '🏠', labelKey: 'dashboard.student.navHome', exact: true },
      ],
    },
    {
      headerKey: 'dashboard.student.sectionLearning',
      items: [
        { href: '/student/tests',      icon: '📝', labelKey: 'dashboard.student.cardTests'       },
        { href: '/student/results',    icon: '📈', labelKey: 'dashboard.student.cardResults'     },
        { href: '/student/grades',     icon: '🎓', labelKey: 'dashboard.student.cardGrades'      },
        { href: '/student/schedule',   icon: '📅', labelKey: 'dashboard.student.cardSchedule'    },
        { href: '/student/attendance', icon: '📋', labelKey: 'dashboard.student.cardAttendance'  },
        { href: '/student/analytics',  icon: '📊', labelKey: 'dashboard.student.cardAnalytics'   },
        { href: '/announcements',      icon: '📢', labelKey: 'dashboard.student.navAnnouncements' },
      ],
    },
  ]

  return (
    <AppShell
      roleLabel={t('dashboard.student.roleLabel')}
      sections={sections}
      mobileTitle={t('dashboard.student.title')}
    >
      {children}
    </AppShell>
  )
}
