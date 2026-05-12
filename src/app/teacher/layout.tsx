'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import AppShell from '@/components/layout/AppShell'
import type { SidebarSection } from '@/components/layout/Sidebar'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()

  const sections: SidebarSection[] = [
    {
      headerKey: 'dashboard.teacher.sectionMain',
      items: [
        { href: '/teacher/dashboard', icon: '🏠', labelKey: 'dashboard.teacher.navHome', exact: true },
      ],
    },
    {
      headerKey: 'dashboard.teacher.sectionTeaching',
      items: [
        { href: '/teacher/tests',         icon: '📝', labelKey: 'dashboard.teacher.cardTests'        },
        { href: '/teacher/gradebook',     icon: '📚', labelKey: 'dashboard.teacher.cardGradeBook'    },
        { href: '/teacher/schedule',      icon: '📅', labelKey: 'dashboard.teacher.cardSchedule'     },
        { href: '/teacher/attendance',    icon: '📋', labelKey: 'dashboard.teacher.cardAttendance'   },
        { href: '/teacher/lesson-plans',  icon: '🗂️', labelKey: 'dashboard.teacher.cardLessonPlans' },
        { href: '/teacher/library',       icon: '📖', labelKey: 'dashboard.teacher.cardLibrary'      },
        { href: '/teacher/notes',         icon: '🗒️', labelKey: 'dashboard.teacher.cardNotes'       },
      ],
    },
    {
      headerKey: 'dashboard.teacher.sectionInsights',
      items: [
        { href: '/teacher/analytics',  icon: '📊', labelKey: 'dashboard.teacher.cardAnalytics'      },
        { href: '/teacher/bulletins',  icon: '📨', labelKey: 'dashboard.teacher.cardBulletins'      },
        { href: '/announcements',      icon: '📢', labelKey: 'dashboard.teacher.cardAnnouncements'  },
      ],
    },
  ]

  return (
    <AppShell
      roleLabel={t('dashboard.teacher.roleLabel')}
      sections={sections}
      mobileTitle={t('dashboard.teacher.title')}
    >
      {children}
    </AppShell>
  )
}
