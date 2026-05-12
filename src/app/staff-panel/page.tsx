'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ROLE_LABELS } from '@/lib/permissions'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import SPStatCard from '@/components/ui/SPStatCard'
import SPCard from '@/components/ui/SPCard'
import SPButton from '@/components/ui/SPButton'
import SPBadge from '@/components/ui/SPBadge'

interface DashboardData {
  pendingAbsences: number
  totalStudents:   number
  missingGuardians: number
  weeklyAbsent:    number
  weeklyLate:      number
  recentAnnouncements: { id: string; title: string; publishedAt: string }[]
  upcomingEvents:      { id: string; title: string; startDate: string }[]
}

const DATE_LOCALES: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' }

function fillTemplate(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    text,
  )
}

export default function StaffDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const [data, setData] = useState<DashboardData | null>(null)

  const role      = (session?.user as { role?: string })?.role ?? ''
  const roleLabel = ROLE_LABELS[role] ?? role
  const locale    = DATE_LOCALES[language] ?? 'tr-TR'

  const greetingKey = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'dashboard.staff.greetingMorning'
    if (h < 18) return 'dashboard.staff.greetingAfternoon'
    return 'dashboard.staff.greetingEvening'
  })()

  useEffect(() => {
    const pending = fetch('/api/admin/absence-notifications?status=PENDING')
      .then(r => r.json()).then(d => ({ pendingAbsences: d.summary?.pending ?? 0 })).catch(() => ({ pendingAbsences: 0 }))
    const students = fetch('/api/admin/guardians')
      .then(r => r.json()).then(d => {
        const list = d.students ?? []
        return { totalStudents: list.length, missingGuardians: list.filter((s: any) => s.guardians.length === 0).length }
      }).catch(() => ({ totalStudents: 0, missingGuardians: 0 }))
    const now   = new Date()
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyStats = fetch(`/api/staff/attendance-stats?since=${weekAgo.toISOString().split('T')[0]}`)
      .then(r => r.json()).then(d => ({ weeklyAbsent: d.absent ?? 0, weeklyLate: d.late ?? 0 }))
      .catch(() => ({ weeklyAbsent: 0, weeklyLate: 0 }))
    const announcements = fetch('/api/announcements')
      .then(r => r.json()).then(d => ({
        recentAnnouncements: (d.announcements ?? []).slice(0, 3).map((a: any) => ({ id: a.id, title: a.title, publishedAt: a.publishedAt })),
      })).catch(() => ({ recentAnnouncements: [] }))
    const events = fetch('/api/events')
      .then(r => r.json()).then(d => ({
        upcomingEvents: (d.events ?? []).filter((e: any) => new Date(e.startDate) >= new Date()).slice(0, 3)
          .map((e: any) => ({ id: e.id, title: e.title, startDate: e.startDate })),
      })).catch(() => ({ upcomingEvents: [] }))

    Promise.all([pending, students, weeklyStats, announcements, events]).then(results => {
      setData(Object.assign({}, ...results))
    })
  }, [])

  return (
    <div className="px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] md:text-[26px] font-bold text-[var(--sp-text-primary)] tracking-tight">
          {t(greetingKey)}, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-[var(--sp-text-secondary)] mt-1">
          {roleLabel} · {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {(data?.pendingAbsences ?? 0) > 0 && (
            <span className="ml-2">
              <SPBadge color="red">
                {fillTemplate(t('dashboard.staff.pendingApprovalBadge'), { count: data!.pendingAbsences })}
              </SPBadge>
            </span>
          )}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <SPStatCard
          icon="⏳"
          iconColor={data?.pendingAbsences ? 'red' : 'blue'}
          value={data?.pendingAbsences ?? '…'}
          label={t('dashboard.staff.cardAttendanceApproval')}
          onClick={() => router.push('/staff-panel/attendance-review')}
        />
        <SPStatCard
          icon="👥"
          iconColor={data?.missingGuardians ? 'amber' : 'cyan'}
          value={data?.totalStudents ?? '…'}
          label={t('dashboard.staff.cardStudents')}
          onClick={() => router.push('/staff-panel/students')}
        />
        <SPStatCard
          icon="📅"
          iconColor="amber"
          value={data?.weeklyAbsent ?? '…'}
          label={t('dashboard.staff.cardWeeklyAbsences')}
          onClick={() => router.push('/staff-panel/reports')}
        />
        <SPStatCard
          icon="📢"
          iconColor="blue"
          value={data?.recentAnnouncements.length ?? '…'}
          label={t('dashboard.staff.cardAnnouncements')}
          onClick={() => router.push('/staff-panel/announcements')}
        />
      </div>

      {/* Sub-captions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 -mt-4 text-[11px] text-[var(--sp-text-muted)]">
        <div>
          {data?.pendingAbsences
            ? fillTemplate(t('dashboard.staff.notificationsPending'), { count: data.pendingAbsences })
            : t('dashboard.staff.noPendingApprovals')}
        </div>
        <div>
          {data?.missingGuardians
            ? fillTemplate(t('dashboard.staff.missingGuardianWarn'), { count: data.missingGuardians })
            : t('dashboard.staff.allGuardiansRegistered')}
        </div>
        <div>
          {fillTemplate(t('dashboard.staff.weeklySummary'), {
            absent: data?.weeklyAbsent ?? 0,
            late:   data?.weeklyLate   ?? 0,
          })}
        </div>
        <div>{t('dashboard.staff.recentAnnouncementsCaption')}</div>
      </div>

      {/* Bottom two columns */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SPCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-[var(--sp-text-primary)]">
              {t('dashboard.staff.recentAnnouncements')}
            </h2>
            <button
              onClick={() => router.push('/staff-panel/announcements')}
              className="text-xs text-[var(--sp-electric)] hover:underline"
            >
              {t('dashboard.staff.all')} →
            </button>
          </div>
          {data?.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-[var(--sp-text-muted)]">{t('dashboard.staff.noAnnouncementsFound')}</p>
          ) : (
            <ul className="space-y-3">
              {data?.recentAnnouncements.map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sp-electric)] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sp-text-primary)]">{a.title}</p>
                    <p className="text-[11px] text-[var(--sp-text-muted)] mt-0.5">{new Date(a.publishedAt).toLocaleDateString(locale)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <SPButton variant="primary" size="sm" className="mt-4 w-full" onClick={() => router.push('/staff-panel/announcements')}>
            {t('dashboard.staff.newAnnouncement')}
          </SPButton>
        </SPCard>

        <SPCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-[var(--sp-text-primary)]">
              {t('dashboard.staff.upcomingEvents')}
            </h2>
            <button
              onClick={() => router.push('/staff-panel/events')}
              className="text-xs text-[var(--sp-electric)] hover:underline"
            >
              {t('dashboard.staff.all')} →
            </button>
          </div>
          {data?.upcomingEvents.length === 0 ? (
            <p className="text-sm text-[var(--sp-text-muted)]">{t('dashboard.staff.noUpcomingEvents')}</p>
          ) : (
            <ul className="space-y-3">
              {data?.upcomingEvents.map(e => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-[var(--sp-pink-bg)] text-[var(--sp-pink-text)] flex items-center justify-center text-sm font-bold shrink-0">
                    {new Date(e.startDate).getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--sp-text-primary)]">{e.title}</p>
                    <p className="text-[11px] text-[var(--sp-text-muted)] mt-0.5">{new Date(e.startDate).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <SPButton variant="primary" size="sm" className="mt-4 w-full" onClick={() => router.push('/staff-panel/events')}>
            {t('dashboard.staff.newEvent')}
          </SPButton>
        </SPCard>
      </div>
    </div>
  )
}
