'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import SPModuleCard from '@/components/ui/SPModuleCard'
import SPBanner from '@/components/ui/SPBanner'
import SPBadge from '@/components/ui/SPBadge'
import type { SPStatColor } from '@/components/ui/SPStatCard'

interface ActionCard {
  href:       string
  icon:       string
  iconColor:  SPStatColor
  titleKey:   string
  descKey:    string
}

const ACTION_CARDS: ActionCard[] = [
  { href: '/manage-panel/students',              icon: '👨‍🎓', iconColor: 'cyan',   titleKey: 'dashboard.admin.cardStudents',             descKey: 'dashboard.admin.cardStudentsDesc'             },
  { href: '/manage-panel/classes',               icon: '🏫', iconColor: 'blue',   titleKey: 'dashboard.admin.cardClasses',              descKey: 'dashboard.admin.cardClassesDesc'              },
  { href: '/manage-panel/teachers',              icon: '👨‍🏫', iconColor: 'amber',  titleKey: 'dashboard.admin.cardTeachers',             descKey: 'dashboard.admin.cardTeachersDesc'             },
  { href: '/manage-panel/courses',               icon: '📚', iconColor: 'violet', titleKey: 'dashboard.admin.cardCourses',              descKey: 'dashboard.admin.cardCoursesDesc'              },
  { href: '/manage-panel/course-assignments',    icon: '📋', iconColor: 'blue',   titleKey: 'dashboard.admin.cardAssignments',          descKey: 'dashboard.admin.cardAssignmentsDesc'          },
  { href: '/manage-panel/schedules',             icon: '📅', iconColor: 'green',  titleKey: 'dashboard.admin.cardSchedules',            descKey: 'dashboard.admin.cardSchedulesDesc'            },
  { href: '/manage-panel/school-settings',       icon: '⚙️', iconColor: 'amber',  titleKey: 'dashboard.admin.cardSettings',             descKey: 'dashboard.admin.cardSettingsDesc'             },
  { href: '/manage-panel/tests',                 icon: '📝', iconColor: 'blue',   titleKey: 'dashboard.admin.cardTests',                descKey: 'dashboard.admin.cardTestsDesc'                },
  { href: '/manage-panel/analytics',             icon: '📊', iconColor: 'indigo', titleKey: 'dashboard.admin.cardAnalytics',            descKey: 'dashboard.admin.cardAnalyticsDesc'            },
  { href: '/manage-panel/announcements',         icon: '📢', iconColor: 'amber',  titleKey: 'dashboard.admin.cardAnnouncements',        descKey: 'dashboard.admin.cardAnnouncementsDesc'        },
  { href: '/manage-panel/events',                icon: '🗓️', iconColor: 'pink',  titleKey: 'dashboard.admin.cardEvents',               descKey: 'dashboard.admin.cardEventsDesc'               },
  { href: '/manage-panel/parents',               icon: '👨‍👩‍👧', iconColor: 'cyan',   titleKey: 'dashboard.admin.cardParents',           descKey: 'dashboard.admin.cardParentsDesc'              },
  { href: '/manage-panel/lesson-plans',          icon: '🗂️', iconColor: 'violet', titleKey: 'dashboard.admin.cardLessonPlans',         descKey: 'dashboard.admin.cardLessonPlansDesc'          },
  { href: '/manage-panel/social-media-managers', icon: '📱', iconColor: 'pink',   titleKey: 'dashboard.admin.cardSocialMedia',          descKey: 'dashboard.admin.cardSocialMediaDesc'          },
  { href: '/manage-panel/staff',                 icon: '👔', iconColor: 'indigo', titleKey: 'dashboard.admin.cardStaff',                descKey: 'dashboard.admin.cardStaffDesc'                },
  { href: '/manage-panel/attendance-review',     icon: '✅', iconColor: 'red',    titleKey: 'dashboard.admin.cardAttendanceApproval',   descKey: 'dashboard.admin.cardAttendanceApprovalDesc'   },
  { href: '/manage-panel/users/pending',         icon: '⏳', iconColor: 'amber',  titleKey: 'dashboard.admin.cardUserApprovals',        descKey: 'dashboard.admin.cardUserApprovalsDesc'        },
  { href: '/manage-panel/documents',             icon: '📄', iconColor: 'cyan',   titleKey: 'dashboard.admin.cardDocuments',            descKey: 'dashboard.admin.cardDocumentsDesc'            },
  { href: '/manage-panel/gdpr',                  icon: '🛡️', iconColor: 'indigo', titleKey: 'dashboard.admin.cardGdpr',           descKey: 'dashboard.admin.cardGdprDesc'                 },
  { href: '/manage-panel/settings/2fa',          icon: '🔐', iconColor: 'indigo', titleKey: 'dashboard.admin.card2fa',            descKey: 'dashboard.admin.card2faDesc'                  },
]

function fillTemplate(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    text,
  )
}

export default function AdminPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [missingGuardians, setMissingGuardians] = useState<number | null>(null)
  const [pendingAbsences,  setPendingAbsences]  = useState<number | null>(null)
  const [pendingUsers,     setPendingUsers]     = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/guardians')
      .then(r => r.json())
      .then(d => {
        const list = d.students ?? []
        setMissingGuardians(list.filter((s: any) => s.guardians.length === 0).length)
      }).catch(() => {})
    fetch('/api/admin/absence-notifications?status=PENDING')
      .then(r => r.json()).then(d => setPendingAbsences(d.summary?.pending ?? 0)).catch(() => {})
    fetch('/api/admin/users/pending?status=PENDING')
      .then(r => r.json()).then(d => setPendingUsers(d.counts?.pending ?? 0)).catch(() => {})
  }, [])

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] md:text-[26px] font-bold text-[var(--sp-text-primary)] tracking-tight">
          {t('dashboard.admin.welcome')}
        </h1>
        <p className="text-sm text-[var(--sp-text-secondary)] mt-1">{t('dashboard.admin.subtitle')}</p>
      </div>

      {/* Alert banners */}
      <div className="space-y-3 mb-6">
        {pendingUsers !== null && pendingUsers > 0 && (
          <SPBanner
            tone="warning"
            icon="⏳"
            title={fillTemplate(t('dashboard.admin.pendingUsersBanner'), { count: pendingUsers })}
            action={
              <button
                onClick={() => router.push('/manage-panel/users/pending')}
                className="text-[12px] font-semibold underline"
              >
                {t('dashboard.admin.pendingUsersLink')}
              </button>
            }
          />
        )}
        {pendingAbsences !== null && pendingAbsences > 0 && (
          <SPBanner
            tone="error"
            title={fillTemplate(t('dashboard.admin.pendingAbsencesBanner'), { count: pendingAbsences })}
            action={
              <button
                onClick={() => router.push('/manage-panel/attendance-review')}
                className="text-[12px] font-semibold underline"
              >
                {t('dashboard.admin.pendingAbsencesLink')}
              </button>
            }
          />
        )}
        {missingGuardians !== null && missingGuardians > 0 && (
          <SPBanner
            tone="warning"
            title={fillTemplate(t('dashboard.admin.missingGuardianBanner'), { count: missingGuardians })}
            action={
              <button
                onClick={() => router.push('/manage-panel/parents')}
                className="text-[12px] font-semibold underline"
              >
                {t('dashboard.admin.missingGuardianLink')}
              </button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {ACTION_CARDS.map(card => (
          <SPModuleCard
            key={card.href}
            icon={card.icon}
            iconColor={card.iconColor}
            title={t(card.titleKey)}
            description={t(card.descKey)}
            href={card.href}
            badge={
              card.href === '/manage-panel/users/pending' && pendingUsers != null && pendingUsers > 0
                ? <SPBadge color="amber">{fillTemplate(t('dashboard.admin.pendingBadge'), { count: pendingUsers })}</SPBadge>
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
