'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  SUBMITTED:   { label: 'Submitted',   color: 'bg-blue-100 text-blue-800' },
  GRADED:      { label: 'Graded',      color: 'bg-green-100 text-green-800' },
  RELEASED:    { label: 'Graded',      color: 'bg-green-100 text-green-800' },
}

export default function StudentResultsListPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/submissions')
      .then(r => r.json())
      .then(data => { if (data.success) setSubmissions(data.submissions) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const released = submissions.filter(s => s.status === 'RELEASED' || s.status === 'GRADED')
  const pending  = submissions.filter(s => s.status === 'SUBMITTED')
  const ongoing  = submissions.filter(s => s.status === 'IN_PROGRESS')

  const renderCard = (s: Submission) => {
    const status = STATUS_MAP[s.status] ?? { label: s.status, color: 'bg-gray-100 text-gray-700' }
    const canView = s.status === 'RELEASED' || s.status === 'GRADED'
    const percentage = s.totalScore != null && s.maxScore
      ? Math.round((s.totalScore / s.maxScore) * 100)
      : null

    return (
      <div key={s.id} className="card hover:shadow-md transition-shadow flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{s.test.title}</h3>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          {s.test.subject && (
            <span className="text-xs text-primary-600 font-medium">{s.test.subject}</span>
          )}
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>Started: {new Date(s.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {s.submittedAt && (
              <span>Submitted: {new Date(s.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {percentage !== null && (
            <div className="text-right">
              <div className={`text-xl font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
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
              View
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Test Results</h1>
            <button onClick={() => router.push('/student/dashboard')} className="btn-secondary">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {submissions.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-gray-500">No test results yet.</p>
          </div>
        )}

        {released.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Graded</h2>
            <div className="space-y-3">{released.map(renderCard)}</div>
          </section>
        )}

        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Awaiting Grade</h2>
            <div className="space-y-3">{pending.map(renderCard)}</div>
          </section>
        )}

        {ongoing.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">In Progress</h2>
            <div className="space-y-3">{ongoing.map(renderCard)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
