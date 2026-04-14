'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Submission {
  id: string
  status: string
  totalScore: number | null
  maxScore: number | null
  startedAt: string
  submittedAt: string | null
  test: {
    title: string
    subject: string | null
  }
}

export default function StudentResultsListPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/submissions')
      .then(r => r.json())
      .then(data => { if (data.success) setSubmissions(data.submissions) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
    IN_PROGRESS: { label: t('dashboard.student.statusInProgress'), color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
    SUBMITTED:   { label: t('dashboard.student.statusSubmitted'),  color: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-500' },
    GRADED:      { label: t('dashboard.student.statusGraded'),     color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
    RELEASED:    { label: t('dashboard.student.statusGraded'),     color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  }

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

  const released = submissions.filter(s => s.status === 'RELEASED' || s.status === 'GRADED')
  const pending  = submissions.filter(s => s.status === 'SUBMITTED')
  const ongoing  = submissions.filter(s => s.status === 'IN_PROGRESS')

  const getScoreColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-600'
    if (pct >= 70) return 'text-blue-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-500'
    if (pct >= 70) return 'bg-blue-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const renderCard = (s: Submission) => {
    const status = STATUS_MAP[s.status] ?? { label: s.status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' }
    const canView = s.status === 'RELEASED' || s.status === 'GRADED'
    const percentage = s.totalScore != null && s.maxScore
      ? Math.round((s.totalScore / s.maxScore) * 100)
      : null

    return (
      <div key={s.id} className="card hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">{s.test.title}</h3>
            <span className={`shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          {s.test.subject && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
              {s.test.subject}
            </span>
          )}
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>{t('dashboard.student.startedAt')} {new Date(s.startedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {s.submittedAt && (
              <span>{t('dashboard.student.submittedAt')} {new Date(s.submittedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
          {percentage !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 max-w-32 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(percentage)}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {percentage !== null && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              <div className="text-xs text-gray-400">{s.totalScore} / {s.maxScore}</div>
            </div>
          )}
          {canView && (
            <button
              onClick={() => router.push(`/student/results/${s.id}`)}
              className="btn-primary text-sm"
            >
              {t('dashboard.student.viewBtn')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📈</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('dashboard.student.resultsTitle')}</h1>
                <p className="text-xs text-gray-500">{submissions.length} {t('dashboard.student.totalSubmissions')}</p>
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

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {submissions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.student.noResults')}</h3>
            <p className="text-gray-500 text-sm">{t('dashboard.student.noResultsDesc')}</p>
          </div>
        )}

        {released.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t('dashboard.student.sectionGraded')} ({released.length})
            </h2>
            <div className="space-y-3">{released.map(renderCard)}</div>
          </section>
        )}

        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {t('dashboard.student.sectionAwaiting')} ({pending.length})
            </h2>
            <div className="space-y-3">{pending.map(renderCard)}</div>
          </section>
        )}

        {ongoing.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {t('dashboard.student.sectionInProgress')} ({ongoing.length})
            </h2>
            <div className="space-y-3">{ongoing.map(renderCard)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
