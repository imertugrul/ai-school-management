'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '@/context/ChildContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import SPCard from '@/components/ui/SPCard'
import SPStatCard from '@/components/ui/SPStatCard'
import SPBadge from '@/components/ui/SPBadge'

interface DashboardData {
  student: { id: string; name: string; className: string; schoolName: string }
  gradeAverage: number | null
  attendanceSummary: { present: number; absent: number; late: number; excused: number }
  upcomingTests: { id: string; title: string; subject: string; dueDate: string }[]
  recentAbsences: { id: string; date: string; status: string; notifStatus: string }[]
  recentBulletins: { id: string; month: string; sentAt: string; gradeAverage: number | null }[]
  announcements: { id: string; title: string; content: string; publishedAt: string; isPinned: boolean; priority: string }[]
}

const ABSENCE_LABEL: Record<string, string> = { ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused', PRESENT: 'Present' }
const DATE_LOCALES: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' }

export default function ParentDashboard() {
  const { selectedChild, loading: childLoading } = useChild()
  const { language } = useLanguage()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const locale = DATE_LOCALES[language] ?? 'tr-TR'

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true)
    setData(null)
    fetch(`/api/parent/children/${selectedChild.id}/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedChild?.id])

  if (childLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--sp-electric)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--sp-text-muted)]">Loading…</p>
        </div>
      </div>
    )
  }
  if (!selectedChild || !data) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">👨‍👩‍👧</div>
        <p className="text-[var(--sp-text-secondary)] text-sm">No registered children found.</p>
      </div>
    )
  }

  const total  = data.attendanceSummary.present + data.attendanceSummary.absent + data.attendanceSummary.late
  const pctStr = total > 0 ? Math.round((data.attendanceSummary.present / total) * 100) : 100

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Student hero */}
      <div className="rounded-[12px] bg-gradient-to-br from-[var(--sp-midnight)] via-[#1E3A8A] to-[var(--sp-electric)] text-white p-5 shadow-[var(--sp-shadow-md)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-xl font-bold shrink-0">
            {data.student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold leading-tight">{data.student.name}</h2>
            <p className="text-[12px] text-white/70 truncate">{data.student.className} · {data.student.schoolName}</p>
          </div>
          {data.gradeAverage !== null && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tracking-tight">{data.gradeAverage}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60">Overall</p>
            </div>
          )}
        </div>
      </div>

      {/* AI banner */}
      <button
        onClick={() => router.push('/parent/chat')}
        className="w-full text-left rounded-[12px] bg-white border border-[var(--sp-border)] hover:border-[var(--sp-electric)] hover:shadow-[var(--sp-shadow-focus)] p-4 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[var(--sp-indigo-bg)] text-[var(--sp-indigo-text)] flex items-center justify-center text-lg">🤖</div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[var(--sp-text-primary)]">AI Okul Asistanı</p>
            <p className="text-[11px] text-[var(--sp-text-muted)] mt-0.5">Notlar, devamsızlık, randevu — hepsi burada</p>
          </div>
          <span className="text-[var(--sp-text-muted)]">→</span>
        </div>
      </button>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <SPStatCard
          icon="📊"
          iconColor="blue"
          value={data.gradeAverage !== null ? data.gradeAverage : '—'}
          label="Overall Average"
          onClick={() => router.push('/parent/grades')}
        />
        <SPStatCard
          icon="📅"
          iconColor={data.attendanceSummary.absent > 0 ? 'amber' : 'green'}
          value={`%${pctStr}`}
          label={`This Month — ${data.attendanceSummary.absent} absent`}
          onClick={() => router.push('/parent/attendance')}
        />
        <SPStatCard
          icon="📋"
          iconColor="violet"
          value={data.recentBulletins.length}
          label="Bulletin"
          onClick={() => router.push('/parent/bulletins')}
        />
        <SPStatCard
          icon="📄"
          iconColor="cyan"
          value="—"
          label="Belgeler · Yönetmelikler"
          onClick={() => router.push('/parent/documents')}
        />
      </div>

      {/* Upcoming tests */}
      {data.upcomingTests.length > 0 && (
        <SPCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--sp-border)]">
            <h3 className="text-[13px] font-semibold text-[var(--sp-text-primary)]">Upcoming Exams</h3>
          </div>
          <ul className="divide-y divide-[var(--sp-border)]">
            {data.upcomingTests.map(test => (
              <li key={test.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[var(--sp-blue-bg)] text-[var(--sp-blue-text)] flex items-center justify-center text-sm">📝</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--sp-text-primary)] truncate">{test.title}</p>
                  <p className="text-[11px] text-[var(--sp-text-muted)]">{test.subject}</p>
                </div>
                <p className="text-[11px] text-[var(--sp-text-muted)] shrink-0">
                  {new Date(test.dueDate).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </p>
              </li>
            ))}
          </ul>
        </SPCard>
      )}

      {/* Recent absences */}
      {data.recentAbsences.length > 0 && (
        <SPCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--sp-border)] flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[var(--sp-text-primary)]">Recent Absences</h3>
            <button onClick={() => router.push('/parent/attendance')} className="text-xs text-[var(--sp-electric)] hover:underline">
              All →
            </button>
          </div>
          <ul className="divide-y divide-[var(--sp-border)]">
            {data.recentAbsences.map(a => (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  a.status === 'ABSENT' ? 'bg-[var(--sp-red-text)]'
                    : a.status === 'LATE' ? 'bg-[var(--sp-amber-text)]'
                    : a.status === 'EXCUSED' ? 'bg-[var(--sp-blue-text)]'
                    : 'bg-[var(--sp-green-text)]'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--sp-text-primary)]">{ABSENCE_LABEL[a.status] ?? a.status}</p>
                  <p className="text-[11px] text-[var(--sp-text-muted)]">{new Date(a.date).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</p>
                </div>
                {a.notifStatus === 'APPROVED' && <SPBadge color="green">Notified</SPBadge>}
                {a.notifStatus === 'PENDING'  && <SPBadge color="amber">Pending</SPBadge>}
              </li>
            ))}
          </ul>
        </SPCard>
      )}

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <SPCard className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--sp-border)]">
            <h3 className="text-[13px] font-semibold text-[var(--sp-text-primary)]">Announcements</h3>
          </div>
          <ul className="divide-y divide-[var(--sp-border)]">
            {data.announcements.map(ann => (
              <li key={ann.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  {ann.isPinned && <span className="text-sm shrink-0">📌</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--sp-text-primary)]">{ann.title}</p>
                    <p className="text-[12px] text-[var(--sp-text-secondary)] mt-0.5 line-clamp-2">{ann.content}</p>
                    <p className="text-[11px] text-[var(--sp-text-muted)] mt-1">
                      {new Date(ann.publishedAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SPCard>
      )}
    </div>
  )
}
