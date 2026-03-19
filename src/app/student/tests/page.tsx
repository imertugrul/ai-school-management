'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Test {
  id: string
  title: string
  subject: string | null
  description: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
  accessCode: string
  assignedAt: string
  _count: { questions: number }
  submission: {
    id: string
    status: string
    totalScore: number | null
    maxScore: number | null
    submittedAt: string | null
  } | null
}

export default function StudentTestsPage() {
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/tests')
      .then(r => r.json())
      .then(data => { if (data.success) setTests(data.tests) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getStatus = (test: Test) => {
    const now = new Date()
    const start = test.startDate ? new Date(test.startDate) : null
    const end = test.endDate ? new Date(test.endDate) : null

    if (test.submission?.status === 'RELEASED') return { label: 'Graded', color: 'bg-green-100 text-green-800' }
    if (test.submission?.status === 'GRADED') return { label: 'Graded', color: 'bg-green-100 text-green-800' }
    if (test.submission?.status === 'SUBMITTED') return { label: 'Submitted', color: 'bg-blue-100 text-blue-800' }
    if (test.submission?.status === 'IN_PROGRESS') return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' }
    if (end && now > end) return { label: 'Expired', color: 'bg-gray-100 text-gray-600' }
    if (start && now < start) return { label: 'Scheduled', color: 'bg-purple-100 text-purple-800' }
    if (!test.isActive) return { label: 'Not Active', color: 'bg-gray-100 text-gray-600' }
    return { label: 'Available', color: 'bg-emerald-100 text-emerald-800' }
  }

  const canTake = (test: Test) => {
    const now = new Date()
    const start = test.startDate ? new Date(test.startDate) : null
    const end = test.endDate ? new Date(test.endDate) : null
    const submitted = ['SUBMITTED', 'GRADED', 'RELEASED'].includes(test.submission?.status || '')
    return (
      test.isActive &&
      !submitted &&
      (!start || now >= start) &&
      (!end || now <= end)
    )
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Tests</h1>
            <button onClick={() => router.push('/student/dashboard')} className="btn-secondary">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {tests.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-4">📝</p>
            <p className="text-gray-500 text-lg">No tests assigned yet.</p>
            <p className="text-gray-400 text-sm mt-2">Your teacher will assign tests to you soon.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => {
              const status = getStatus(test)
              const takeable = canTake(test)
              const score = test.submission?.totalScore
              const max = test.submission?.maxScore

              return (
                <div key={test.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      {test.subject && (
                        <span className="text-sm text-primary-600 font-medium">{test.subject}</span>
                      )}
                      {test.description && (
                        <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-gray-500 mb-4">
                    <span>📝 {test._count.questions} questions</span>
                    <span>📅 Assigned {new Date(test.assignedAt).toLocaleDateString('en-US')}</span>
                    {test.startDate && (
                      <span>🕐 Starts {new Date(test.startDate).toLocaleDateString('en-US')}</span>
                    )}
                    {test.endDate && (
                      <span>⏰ Due {new Date(test.endDate).toLocaleDateString('en-US')}</span>
                    )}
                  </div>

                  {(test.submission?.status === 'RELEASED' || test.submission?.status === 'GRADED') && score != null && max != null && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Score: {score} / {max} ({Math.round((score / max) * 100)}%)
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {takeable && (
                      <button
                        onClick={() => router.push(`/student/test/${test.id}`)}
                        className="btn-primary"
                      >
                        {test.submission?.status === 'IN_PROGRESS' ? 'Continue Test' : 'Start Test'}
                      </button>
                    )}
                    {(test.submission?.status === 'RELEASED' || test.submission?.status === 'GRADED') && (
                      <button
                        onClick={() => router.push(`/student/results/${test.submission!.id}`)}
                        className="btn-secondary"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
