'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ROLE_LABELS } from '@/lib/permissions'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface DashboardData {
  pendingAbsences: number
  totalStudents: number
  missingGuardians: number
  weeklyAbsent: number
  weeklyLate: number
  recentAnnouncements: { id: string; title: string; publishedAt: string }[]
  upcomingEvents: { id: string; title: string; startDate: string }[]
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
        recentAnnouncements: (d.announcements ?? []).slice(0, 3).map((a: any) => ({ id: a.id, title: a.title, publishedAt: a.publishedAt }))
      })).catch(() => ({ recentAnnouncements: [] }))

    const events = fetch('/api/events')
      .then(r => r.json()).then(d => ({
        upcomingEvents: (d.events ?? []).filter((e: any) => new Date(e.startDate) >= new Date()).slice(0, 3)
          .map((e: any) => ({ id: e.id, title: e.title, startDate: e.startDate }))
      })).catch(() => ({ upcomingEvents: [] }))

    Promise.all([pending, students, weeklyStats, announcements, events]).then(results => {
      setData(Object.assign({}, ...results))
    })
  }, [])

  const cards = [
    {
      icon: '⏳',
      title: t('dashboard.staff.cardAttendanceApproval'),
      value: data?.pendingAbsences ?? '…',
      subtitle: data?.pendingAbsences
        ? fillTemplate(t('dashboard.staff.notificationsPending'), { count: data.pendingAbsences })
        : t('dashboard.staff.noPendingApprovals'),
      urgent: (data?.pendingAbsences ?? 0) > 0,
      href: '/staff-panel/attendance-review',
      gradient: 'from-red-500 to-rose-600',
      cls: 'border-red-200',
    },
    {
      icon: '👥',
      title: t('dashboard.staff.cardStudents'),
      value: data?.totalStudents ?? '…',
      subtitle: data?.missingGuardians
        ? fillTemplate(t('dashboard.staff.missingGuardianWarn'), { count: data.missingGuardians })
        : t('dashboard.staff.allGuardiansRegistered'),
      urgent: (data?.missingGuardians ?? 0) > 0,
      href: '/staff-panel/students',
      gradient: 'from-teal-500 to-cyan-600',
      cls: 'border-teal-200',
    },
    {
      icon: '📅',
      title: t('dashboard.staff.cardWeeklyAbsences'),
      value: data?.weeklyAbsent ?? '…',
      subtitle: fillTemplate(t('dashboard.staff.weeklySummary'), {
        absent: data?.weeklyAbsent ?? 0,
        late: data?.weeklyLate ?? 0,
      }),
      urgent: false,
      href: '/staff-panel/reports',
      gradient: 'from-amber-500 to-orange-600',
      cls: 'border-amber-200',
    },
    {
      icon: '📢',
      title: t('dashboard.staff.cardAnnouncements'),
      value: data?.recentAnnouncements.length ?? '…',
      subtitle: t('dashboard.staff.recentAnnouncementsCaption'),
      urgent: false,
      href: '/staff-panel/announcements',
      gradient: 'from-blue-500 to-indigo-600',
      cls: 'border-blue-200',
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t(greetingKey)}, {session?.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {roleLabel} · {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {(data?.pendingAbsences ?? 0) > 0 && (
            <span className="ml-2 text-red-600 font-semibold">
              📋 {fillTemplate(t('dashboard.staff.pendingApprovalBadge'), { count: data!.pendingAbsences })}
            </span>
          )}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className={`group text-left bg-white rounded-2xl border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${card.cls} ${card.urgent ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-white text-xl">{card.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">{card.title}</div>
            <div className={`text-xs mt-1 ${card.urgent ? 'text-red-600 font-medium' : 'text-gray-400'}`}>{card.subtitle}</div>
          </button>
        ))}
      </div>

      {/* Bottom two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent announcements */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{t('dashboard.staff.recentAnnouncements')}</h2>
            <button onClick={() => router.push('/staff-panel/announcements')} className="text-xs text-indigo-600 hover:underline">{t('dashboard.staff.all')} →</button>
          </div>
          {data?.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400">{t('dashboard.staff.noAnnouncementsFound')}</p>
          ) : (
            <div className="space-y-3">
              {data?.recentAnnouncements.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400">{new Date(a.publishedAt).toLocaleDateString(locale)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/staff-panel/announcements')}
            className="mt-4 w-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl transition-colors"
          >
            {t('dashboard.staff.newAnnouncement')}
          </button>
        </div>

        {/* Upcoming events */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{t('dashboard.staff.upcomingEvents')}</h2>
            <button onClick={() => router.push('/staff-panel/events')} className="text-xs text-indigo-600 hover:underline">{t('dashboard.staff.all')} →</button>
          </div>
          {data?.upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-400">{t('dashboard.staff.noUpcomingEvents')}</p>
          ) : (
            <div className="space-y-3">
              {data?.upcomingEvents.map(e => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-rose-600">
                    {new Date(e.startDate).getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.title}</p>
                    <p className="text-xs text-gray-400">{new Date(e.startDate).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/staff-panel/events')}
            className="mt-4 w-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 py-2 rounded-xl transition-colors"
          >
            {t('dashboard.staff.newEvent')}
          </button>
        </div>
      </div>
    </div>
  )
}
