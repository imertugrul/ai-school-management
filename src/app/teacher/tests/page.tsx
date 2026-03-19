'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Test {
  id: string
  title: string
  subject: string | null
  description: string | null
  createdAt: string
  isPublished: boolean
  isActive: boolean
  startDate: string | null
  endDate: string | null
  accessCode: string
  questions: any[]
  _count: {
    submissions: number
  }
}

export default function TestsListPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests')
      const data = await response.json()

      if (data.success) {
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (test: Test) => {
    const now = new Date()
    const startDate = test.startDate ? new Date(test.startDate) : null
    const endDate = test.endDate ? new Date(test.endDate) : null
    const isScheduled = startDate && now < startDate
    const isExpired = endDate && now > endDate

    if (test.isActive) return { label: 'Active', className: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
    if (isScheduled) return { label: 'Scheduled', className: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' }
    if (isExpired) return { label: 'Expired', className: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
    return { label: 'Inactive', className: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
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
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Tests</h1>
                <p className="text-xs text-gray-500">{tests.length} tests total</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/teacher/tests/create')}
                className="btn-primary"
              >
                + New Test
              </button>
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {tests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first test to get started</p>
            <button
              onClick={() => router.push('/teacher/tests/create')}
              className="btn-primary"
            >
              Create Your First Test
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {tests.map((test) => {
              const now = new Date()
              const startDate = test.startDate ? new Date(test.startDate) : null
              const endDate = test.endDate ? new Date(test.endDate) : null

              const isScheduled = startDate && now < startDate
              const isExpired = endDate && now > endDate
              const canStart = !isScheduled && !isExpired

              const statusBadge = getStatusBadge(test)

              return (
                <div key={test.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">
                          {test.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
                      </div>

                      {test.subject && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
                          {test.subject}
                        </span>
                      )}

                      {test.description && (
                        <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                      )}

                      <div className="flex gap-5 text-sm text-gray-500 mb-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span>📝</span> {test.questions.length} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📊</span> {test._count.submissions} Submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📅</span> {new Date(test.createdAt).toLocaleDateString('en-US')}
                        </span>
                      </div>

                      {(startDate || endDate) && (
                        <div className="text-sm text-gray-500 space-y-1 mb-4">
                          {startDate && (
                            <div>Start: {startDate.toLocaleDateString('en-US')} {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                          )}
                          {endDate && (
                            <div>End: {endDate.toLocaleDateString('en-US')} {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                          )}
                        </div>
                      )}

                      {/* Access Code */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-blue-900">Test Code:</span>
                            <code className="ml-2 text-2xl font-bold text-blue-600 tracking-wider">{test.accessCode}</code>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(test.accessCode)
                              alert('Code copied!')
                            }}
                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Copy Code
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                          <code className="text-xs bg-white border border-blue-200 px-2 py-1 rounded-lg text-blue-700">
                            {typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}/join/{test.accessCode}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/join/${test.accessCode}`)
                              alert('Link copied!')
                            }}
                            className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                          >
                            Copy Link
                          </button>
                        </div>
                        <p className="text-xs text-blue-600">
                          Students can join using the code or link
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                    {canStart && (
                      test.isActive ? (
                        <button
                          onClick={async () => {
                            await fetch(`/api/tests/${test.id}/toggle-status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isActive: false })
                            })
                            fetchTests()
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold transition-colors"
                        >
                          Stop
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await fetch(`/api/tests/${test.id}/toggle-status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isActive: true })
                            })
                            fetchTests()
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition-colors"
                        >
                          Start
                        </button>
                      )
                    )}

                    <button
                      onClick={() => router.push(`/teacher/tests/${test.id}/monitor`)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold transition-colors"
                    >
                      🔴 Live Monitor
                    </button>

                    <button
                      onClick={() => router.push(`/teacher/tests/${test.id}/results`)}
                      className="btn-primary text-sm"
                    >
                      Results
                    </button>

                    <button
                      onClick={() => router.push(`/teacher/tests/${test.id}`)}
                      className="btn-secondary text-sm"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => router.push(`/teacher/tests/${test.id}/edit`)}
                      className="btn-secondary text-sm"
                    >
                      Edit
                    </button>
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
