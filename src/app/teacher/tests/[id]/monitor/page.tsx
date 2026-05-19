'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface StudentData {
  studentId: string
  studentName: string
  studentEmail: string
  status: 'submitted' | 'in_progress' | 'not_started'
  currentQuestion: number
  lastActiveAt: string | null
  submittedAt: string | null
  totalViolations: number
  tabSwitches: number
  windowBlurs: number
  copyPastes: number
}

interface Stats {
  total: number
  submitted: number
  inProgress: number
  notStarted: number
  suspicious: number
}

export default function LiveMonitorPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string
  const { t, language } = useLanguage()

  const timeSince = useCallback((date: string | null) => {
    if (!date) return '—'
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return `${secs}${t('monitor.secondsAgo')}`
    if (secs < 3600) return `${Math.floor(secs / 60)}${t('monitor.minutesAgo')}`
    return `${Math.floor(secs / 3600)}${t('monitor.hoursAgo')}`
  }, [t])

  const [students, setStudents] = useState<StudentData[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, inProgress: 0, notStarted: 0, suspicious: 0 })
  const [testTitle, setTestTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/live-monitor`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.students)
        setStats(data.stats)
        setTestTitle(data.test?.title || '')
        setLastUpdate(new Date())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [testId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const statusIcon = (s: StudentData['status']) =>
    s === 'submitted' ? '✅' : s === 'in_progress' ? '🟡' : '⏳'

  const statusLabel = (s: StudentData['status']) =>
    s === 'submitted' ? t('monitor.statusSubmitted')
    : s === 'in_progress' ? t('monitor.statusInProgress')
    : t('monitor.statusNotStarted')

  const statusCls = (s: StudentData['status']) =>
    s === 'submitted' ? 'bg-emerald-100 text-emerald-700'
    : s === 'in_progress' ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-500'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const submitPct = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h1 className="text-base font-bold text-gray-900">🔴 {t('monitor.title')}</h1>
                {testTitle && <p className="text-xs text-gray-500 truncate max-w-xs">{testTitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-xs text-gray-400">
                  {t('monitor.lastUpdate')}: {lastUpdate.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
              )}
              <button
                onClick={() => router.push('/teacher/tests')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← {t('monitor.backToTests')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: t('monitor.statTotal'),       value: stats.total,      cls: 'text-gray-900' },
            { label: t('monitor.statSubmitted'),   value: stats.submitted,  cls: 'text-emerald-600' },
            { label: t('monitor.statInProgress'),  value: stats.inProgress, cls: 'text-blue-600' },
            { label: t('monitor.statNotStarted'),  value: stats.notStarted, cls: 'text-gray-500' },
            { label: t('monitor.statSuspicious'),  value: stats.suspicious, cls: 'text-red-600' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className={`text-3xl font-bold ${cls}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>{t('monitor.progressLabel')}</span>
            <span>{stats.submitted}/{stats.total} — {submitPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${submitPct}%` }}
            />
          </div>
        </div>

        {/* Student list */}
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-400 text-lg">{t('monitor.noStudents')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">{t('monitor.studentList')}</h2>
              <span className="text-xs text-gray-400">{t('monitor.refreshNote')}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {students
                .sort((a, b) => {
                  // Sort: in_progress first, then not_started, then submitted
                  const order = { in_progress: 0, not_started: 1, submitted: 2 }
                  const diff = order[a.status] - order[b.status]
                  if (diff !== 0) return diff
                  // Within same status, sort suspicious first
                  return b.totalViolations - a.totalViolations
                })
                .map((student) => (
                  <div
                    key={student.studentId}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${
                      student.totalViolations > 2 ? 'bg-red-50/50' : ''
                    }`}
                  >
                    {/* Status icon */}
                    <span className="text-xl w-7 text-center shrink-0">{statusIcon(student.status)}</span>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{student.studentName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls(student.status)}`}>
                          {statusLabel(student.status)}
                        </span>
                        {student.status === 'in_progress' && (
                          <span className="text-xs text-blue-600">{t('monitor.questionShort')}{student.currentQuestion + 1}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{student.studentEmail}</p>
                    </div>

                    {/* Violations */}
                    <div className="flex items-center gap-2 shrink-0">
                      {student.totalViolations > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {student.tabSwitches > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              🗂 {student.tabSwitches} {t('monitor.tabSwitches')}
                            </span>
                          )}
                          {student.windowBlurs > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                              🪟 {student.windowBlurs} {t('monitor.windowBlurs')}
                            </span>
                          )}
                          {student.copyPastes > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                              📋 {student.copyPastes} {t('monitor.copyPastes')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">✓ {t('monitor.clean')}</span>
                      )}
                    </div>

                    {/* Last active */}
                    <div className="text-xs text-gray-400 shrink-0 text-right min-w-[80px]">
                      {student.status === 'submitted'
                        ? student.submittedAt ? new Date(student.submittedAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'
                        : timeSince(student.lastActiveAt)
                      }
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
