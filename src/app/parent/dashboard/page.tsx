'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChild } from '@/context/ChildContext'

interface DashboardData {
  student: { id: string; name: string; className: string; schoolName: string }
  gradeAverage: number | null
  attendanceSummary: { present: number; absent: number; late: number; excused: number }
  upcomingTests: { id: string; title: string; subject: string; dueDate: string }[]
  recentAbsences: { id: string; date: string; status: string; notifStatus: string }[]
  recentBulletins: { id: string; month: string; sentAt: string; gradeAverage: number | null }[]
  announcements: { id: string; title: string; content: string; publishedAt: string; isPinned: boolean; priority: string }[]
}

function gradeColor(avg: number | null) {
  if (avg === null) return 'text-gray-400'
  if (avg >= 85) return 'text-green-600'
  if (avg >= 70) return 'text-amber-600'
  return 'text-red-600'
}

const ABSENCE_ICON: Record<string, string> = { ABSENT: '🔴', LATE: '🟡', PRESENT: '🟢', EXCUSED: '🔵' }
const ABSENCE_LABEL: Record<string, string> = { ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused', PRESENT: 'Present' }

export default function ParentDashboard() {
  const { selectedChild, loading: childLoading } = useChild()
  const [data, setData]     = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true)
    setData(null)
    fetch(`/api/parent/children/${selectedChild.id}/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedChild?.id])

  if (childLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!selectedChild || !data) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">👨‍👩‍👧</div>
        <p className="text-gray-500 text-sm">No registered children found.</p>
        <p className="text-gray-400 text-xs mt-2">Please contact the school administrator.</p>
      </div>
    )
  }

  const total  = data.attendanceSummary.present + data.attendanceSummary.absent + data.attendanceSummary.late
  const pctStr = total > 0 ? Math.round((data.attendanceSummary.present / total) * 100) : 100

  return (
    <div className="space-y-4">
      {/* Student card */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {data.student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{data.student.name}</h2>
            <p className="text-blue-100 text-sm">{data.student.className} — {data.student.schoolName}</p>
          </div>
          {data.gradeAverage !== null && (
            <div className="text-right">
              <p className="text-3xl font-bold">{data.gradeAverage}</p>
              <p className="text-blue-100 text-xs">Overall Avg.</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/parent/grades')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">📊</p>
          <p className={`text-2xl font-bold ${gradeColor(data.gradeAverage)}`}>
            {data.gradeAverage !== null ? `${data.gradeAverage}` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Overall Average</p>
        </button>

        <button
          onClick={() => router.push('/parent/attendance')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">📅</p>
          <p className="text-2xl font-bold text-gray-900">%{pctStr}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            This Month Attendance — {data.attendanceSummary.absent} absent
          </p>
        </button>

        <button
          onClick={() => router.push('/parent/bulletins')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">📋</p>
          <p className="text-2xl font-bold text-gray-900">{data.recentBulletins.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Bulletin</p>
          {data.recentBulletins[0] && (
            <p className="text-xs text-blue-500 mt-1">{data.recentBulletins[0].month} →</p>
          )}
        </button>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl mb-1">📝</p>
          <p className="text-2xl font-bold text-gray-900">{data.upcomingTests.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Upcoming Exam</p>
          {data.upcomingTests[0] && (
            <p className="text-xs text-gray-400 mt-1 truncate">{data.upcomingTests[0].title}</p>
          )}
        </div>
      </div>

      {/* Upcoming tests */}
      {data.upcomingTests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Upcoming Exams</h3>
          </div>
          {data.upcomingTests.map(t => (
            <div key={t.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">📝</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                <p className="text-xs text-gray-400">{t.subject}</p>
              </div>
              <p className="text-xs text-gray-500 shrink-0">
                {new Date(t.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recent absences */}
      {data.recentAbsences.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Absences</h3>
            <button onClick={() => router.push('/parent/attendance')} className="text-xs text-blue-500">
              All →
            </button>
          </div>
          {data.recentAbsences.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <span className="text-lg">{ABSENCE_ICON[a.status] ?? '⚪'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{ABSENCE_LABEL[a.status] ?? a.status}</p>
                <p className="text-xs text-gray-400">
                  {new Date(a.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              {a.notifStatus === 'APPROVED' && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Notified</span>
              )}
              {a.notifStatus === 'PENDING' && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Announcements</h3>
          </div>
          {data.announcements.map(ann => (
            <div key={ann.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-start gap-2">
                {ann.isPinned && <span className="text-sm shrink-0">📌</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{ann.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ann.publishedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
