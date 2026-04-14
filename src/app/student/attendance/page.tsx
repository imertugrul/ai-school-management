'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes: string | null
  class: { name: string }
}

interface Stats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  rate: number
}

const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  ABSENT:  'bg-red-100 text-red-800',
  LATE:    'bg-amber-100 text-amber-800',
  EXCUSED: 'bg-blue-100 text-blue-800',
}

const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-500',
  ABSENT:  'bg-red-500',
  LATE:    'bg-amber-500',
  EXCUSED: 'bg-blue-500',
}

export default function StudentAttendancePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/attendance')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRecords(data.records)
          setStats(data.stats)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('dashboard.teacher.loading')}</p>
        </div>
      </div>
    )
  }

  const rateColor = stats
    ? stats.rate >= 90 ? 'text-emerald-600' : stats.rate >= 75 ? 'text-amber-600' : 'text-red-600'
    : 'text-gray-600'

  const rateBarColor = stats
    ? stats.rate >= 90 ? 'bg-emerald-500' : stats.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
    : 'bg-gray-400'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('dashboard.student.myAttendance')}</h1>
                <p className="text-xs text-gray-500">{records.length} records</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {t('dashboard.student.back')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('dashboard.student.attendanceRate'), value: `${stats.rate}%`, color: rateColor, bg: 'from-gray-50' },
              { label: t('dashboard.teacher.present'), value: stats.present, color: 'text-emerald-600', bg: 'from-emerald-50' },
              { label: t('dashboard.teacher.absent'),  value: stats.absent,  color: 'text-red-600',     bg: 'from-red-50' },
              { label: t('dashboard.teacher.late'),    value: stats.late,    color: 'text-amber-600',   bg: 'from-amber-50' },
            ].map(s => (
              <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${s.bg} to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60`} />
                <div className="relative">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attendance rate bar */}
        {stats && (
          <div className="card">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-gray-700">{t('dashboard.student.overallRate')}</span>
              <span className={`font-bold text-lg ${rateColor}`}>{stats.rate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${rateBarColor}`}
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            {stats.rate < 90 && (
              <p className="text-xs text-gray-400 mt-2">
                {stats.rate >= 75
                  ? t('dashboard.student.attendanceWarnBelow90')
                  : t('dashboard.student.attendanceLow')}
              </p>
            )}
          </div>
        )}

        {/* Records */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-5 border-l-4 border-orange-500 pl-4">
            {t('dashboard.student.attendanceRecords')}
            <span className="ml-2 text-sm font-normal text-gray-400">({records.length})</span>
          </h2>

          {records.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.student.noAttendanceRecords')}</h3>
              <p className="text-gray-500 text-sm">{t('dashboard.student.noAttendanceRecordsDesc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map(r => (
                <div key={r.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(r.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.class.name}{r.notes ? ` · ${r.notes}` : ''}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[r.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
                    {t(`dashboard.teacher.${r.status.toLowerCase()}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
