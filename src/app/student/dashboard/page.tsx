'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import SPStatCard, { SPStatColor } from '@/components/ui/SPStatCard'
import SPModuleCard from '@/components/ui/SPModuleCard'

interface StudentStats {
  coursesEnrolled:   number
  averageGrade:      number
  attendanceRate:    number
  pendingTests:      number
  isNinthGrade:      boolean
  unipathCompletion: number
}

interface ModuleCard {
  href:       string
  icon:       string
  iconColor:  SPStatColor
  titleKey:   string
  descKey:    string
}

const MODULE_CARDS: ModuleCard[] = [
  { href: '/student/tests',      icon: '📝', iconColor: 'blue',   titleKey: 'dashboard.student.cardTests',         descKey: 'dashboard.student.cardTestsDesc'         },
  { href: '/student/results',    icon: '📈', iconColor: 'pink',   titleKey: 'dashboard.student.cardResults',       descKey: 'dashboard.student.cardResultsDesc'       },
  { href: '/student/grades',     icon: '🎓', iconColor: 'green',  titleKey: 'dashboard.student.cardGrades',        descKey: 'dashboard.student.cardGradesDesc'        },
  { href: '/student/schedule',   icon: '📅', iconColor: 'cyan',   titleKey: 'dashboard.student.cardSchedule',      descKey: 'dashboard.student.cardScheduleDesc'      },
  { href: '/student/attendance', icon: '📋', iconColor: 'amber',  titleKey: 'dashboard.student.cardAttendance',    descKey: 'dashboard.student.cardAttendanceDesc'    },
  { href: '/student/analytics',  icon: '📊', iconColor: 'indigo', titleKey: 'dashboard.student.cardAnalytics',     descKey: 'dashboard.student.cardAnalyticsDesc'     },
  { href: '/announcements',      icon: '📢', iconColor: 'violet', titleKey: 'dashboard.student.cardAnnouncements', descKey: 'dashboard.student.cardAnnouncementsDesc' },
  { href: '/events',             icon: '🗓️', iconColor: 'pink',  titleKey: 'dashboard.student.cardEvents',        descKey: 'dashboard.student.cardEventsDesc'        },
]

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [stats, setStats] = useState<StudentStats>({
    coursesEnrolled: 0, averageGrade: 0, attendanceRate: 0, pendingTests: 0,
    isNinthGrade: false, unipathCompletion: 0,
  })

  useEffect(() => {
    fetch('/api/student/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
      .catch(() => {})
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] md:text-[26px] font-bold text-[var(--sp-text-primary)] tracking-tight">
          {t('dashboard.student.welcome')}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-[var(--sp-text-secondary)] mt-1">{t('dashboard.student.welcomeSub')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <SPStatCard icon="📚" iconColor="blue"  value={stats.coursesEnrolled} label={t('dashboard.student.courses')} />
        <SPStatCard icon="📊" iconColor="green" value={stats.averageGrade > 0 ? `${stats.averageGrade}%` : '—'} label={t('dashboard.student.averageGrade')} />
        <SPStatCard icon="✅" iconColor="cyan"  value={stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : '—'} label={t('dashboard.student.attendance')} />
        <SPStatCard icon="📝" iconColor="amber" value={stats.pendingTests}    label={t('dashboard.student.pendingTests')} />
      </div>

      {/* UniPath strip for grade 9 */}
      {stats.isNinthGrade && (
        <button
          onClick={() => router.push('/student/unipath')}
          className="group w-full text-left bg-gradient-to-r from-[var(--sp-electric)] to-[var(--sp-cyan)] text-white rounded-[12px] p-5 mb-6 shadow-[var(--sp-shadow-md)] hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[10px] bg-white/20 flex items-center justify-center text-xl shrink-0">🎓</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{t('dashboard.student.cardUnipath')}</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/25">{t('dashboard.student.newBadge')}</span>
              </div>
              <p className="text-[12px] opacity-90 mt-0.5 line-clamp-1">{t('dashboard.student.cardUnipathDesc')}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${stats.unipathCompletion}%` }} />
                </div>
                <span className="text-[11px] font-semibold">{stats.unipathCompletion}%</span>
              </div>
            </div>
            <span className="text-xl opacity-80 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      )}

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
