'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import SPStatCard, { SPStatColor } from '@/components/ui/SPStatCard'
import SPModuleCard from '@/components/ui/SPModuleCard'

interface TeacherStats {
  testsCreated:   number
  studentsGraded: number
  averageScore:   number
  classesCount:   number
}

interface ModuleCard {
  href:       string
  icon:       string
  iconColor:  SPStatColor
  titleKey:   string
  descKey:    string
}

const MODULE_CARDS: ModuleCard[] = [
  { href: '/teacher/tests',        icon: '📝', iconColor: 'blue',   titleKey: 'dashboard.teacher.cardTests',         descKey: 'dashboard.teacher.cardTestsDesc'         },
  { href: '/teacher/gradebook',    icon: '📚', iconColor: 'violet', titleKey: 'dashboard.teacher.cardGradeBook',     descKey: 'dashboard.teacher.cardGradeBookDesc'     },
  { href: '/teacher/schedule',     icon: '📅', iconColor: 'green',  titleKey: 'dashboard.teacher.cardSchedule',      descKey: 'dashboard.teacher.cardScheduleDesc'      },
  { href: '/teacher/attendance',   icon: '📋', iconColor: 'amber',  titleKey: 'dashboard.teacher.cardAttendance',    descKey: 'dashboard.teacher.cardAttendanceDesc'    },
  { href: '/teacher/analytics',    icon: '📊', iconColor: 'indigo', titleKey: 'dashboard.teacher.cardAnalytics',     descKey: 'dashboard.teacher.cardAnalyticsDesc'     },
  { href: '/teacher/lesson-plans', icon: '🗂️', iconColor: 'violet', titleKey: 'dashboard.teacher.cardLessonPlans',  descKey: 'dashboard.teacher.cardLessonPlansDesc'  },
  { href: '/teacher/notes',        icon: '🗒️', iconColor: 'amber',  titleKey: 'dashboard.teacher.cardNotes',        descKey: 'dashboard.teacher.cardNotesDesc'        },
  { href: '/teacher/library',      icon: '📖', iconColor: 'cyan',   titleKey: 'dashboard.teacher.cardLibrary',       descKey: 'dashboard.teacher.cardLibraryDesc'       },
  { href: '/announcements',        icon: '📢', iconColor: 'pink',   titleKey: 'dashboard.teacher.cardAnnouncements', descKey: 'dashboard.teacher.cardAnnouncementsDesc' },
  { href: '/teacher/bulletins',    icon: '📨', iconColor: 'cyan',   titleKey: 'dashboard.teacher.cardBulletins',     descKey: 'dashboard.teacher.cardBulletinsDesc'     },
]

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [stats, setStats] = useState<TeacherStats>({
    testsCreated: 0, studentsGraded: 0, averageScore: 0, classesCount: 0,
  })

  useEffect(() => {
    fetch('/api/teacher/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
      .catch(() => {})
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] md:text-[26px] font-bold text-[var(--sp-text-primary)] tracking-tight">
          {t('dashboard.teacher.welcome')}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-[var(--sp-text-secondary)] mt-1">{t('dashboard.teacher.welcomeSub')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <SPStatCard icon="📝" iconColor="blue"   value={stats.testsCreated}    label={t('dashboard.teacher.testsCreated')} />
        <SPStatCard icon="👥" iconColor="violet" value={stats.studentsGraded}  label={t('dashboard.teacher.submissions')}   />
        <SPStatCard icon="🎓" iconColor="green"  value={stats.classesCount}    label={t('dashboard.teacher.classes')}       />
        <SPStatCard icon="📊" iconColor="amber"  value={stats.averageScore > 0 ? `${stats.averageScore}%` : '—'} label={t('dashboard.teacher.averageScore')} />
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {MODULE_CARDS.map(card => (
          <SPModuleCard
            key={card.href}
            icon={card.icon}
            iconColor={card.iconColor}
            title={t(card.titleKey)}
            description={t(card.descKey)}
            href={card.href}
          />
        ))}
      </div>
    </div>
  )
}
