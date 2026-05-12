'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import AppShell from '@/components/layout/AppShell'
import type { SidebarSection } from '@/components/layout/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    const checkAdmin = async () => {
      const r = await fetch('/api/auth/me')
      const d = await r.json()
      if (d.user?.role !== 'ADMIN') {
        alert('Access Denied: Admin privileges required')
        router.push('/teacher/dashboard')
      }
    }
    checkAdmin()
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sp-bg)]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--sp-electric)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--sp-text-muted)]">Loading…</p>
        </div>
      </div>
    )
  }
  if (!session) return null

  const sections: SidebarSection[] = [
    {
      headerKey: 'dashboard.admin.sectionMain',
      items: [
        { href: '/manage-panel', icon: '🏠', labelKey: 'dashboard.admin.navHome', exact: true },
      ],
    },
    {
      headerKey: 'dashboard.admin.sectionPeople',
      items: [
        { href: '/manage-panel/students', icon: '👨‍🎓', labelKey: 'dashboard.admin.cardStudents' },
        { href: '/manage-panel/teachers', icon: '👨‍🏫', labelKey: 'dashboard.admin.cardTeachers' },
        { href: '/manage-panel/parents',  icon: '👨‍👩‍👧', labelKey: 'dashboard.admin.cardParents'  },
        { href: '/manage-panel/staff',    icon: '👔',  labelKey: 'dashboard.admin.cardStaff'    },
        { href: '/manage-panel/users/pending',  icon: '⏳', labelKey: 'dashboard.admin.cardUserApprovals' },
      ],
    },
    {
      headerKey: 'dashboard.admin.sectionAcademic',
      items: [
        { href: '/manage-panel/classes',            icon: '🏫', labelKey: 'dashboard.admin.cardClasses'            },
        { href: '/manage-panel/courses',            icon: '📚', labelKey: 'dashboard.admin.cardCourses'            },
        { href: '/manage-panel/course-assignments', icon: '📋', labelKey: 'dashboard.admin.cardAssignments'        },
        { href: '/manage-panel/schedules',          icon: '📅', labelKey: 'dashboard.admin.cardSchedules'          },
        { href: '/manage-panel/tests',              icon: '📝', labelKey: 'dashboard.admin.cardTests'              },
        { href: '/manage-panel/lesson-plans',       icon: '🗂️', labelKey: 'dashboard.admin.cardLessonPlans'       },
        { href: '/manage-panel/attendance-review',  icon: '✅', labelKey: 'dashboard.admin.cardAttendanceApproval' },
        { href: '/manage-panel/analytics',          icon: '📊', labelKey: 'dashboard.admin.cardAnalytics'          },
      ],
    },
    {
      headerKey: 'dashboard.admin.sectionContent',
      items: [
        { href: '/manage-panel/announcements',         icon: '📢', labelKey: 'dashboard.admin.cardAnnouncements' },
        { href: '/manage-panel/events',                icon: '🗓️', labelKey: 'dashboard.admin.cardEvents'       },
        { href: '/manage-panel/documents',             icon: '📄', labelKey: 'dashboard.admin.cardDocuments'    },
        { href: '/manage-panel/social-media-managers', icon: '📱', labelKey: 'dashboard.admin.cardSocialMedia'   },
      ],
    },
    {
      headerKey: 'dashboard.admin.sectionSettings',
      items: [
        { href: '/manage-panel/school-settings', icon: '⚙️', labelKey: 'dashboard.admin.cardSettings' },
        { href: '/manage-panel/gdpr',            icon: '🛡️', labelKey: 'dashboard.admin.cardGdpr'    },
        { href: '/manage-panel/settings/2fa',    icon: '🔐', labelKey: 'dashboard.admin.card2fa'     },
      ],
    },
  ]

  return (
    <AppShell
      roleLabel={t('dashboard.admin.roleLabel')}
      sections={sections}
      mobileTitle={t('dashboard.admin.panelTitle')}
    >
      {children}
    </AppShell>
  )
}
