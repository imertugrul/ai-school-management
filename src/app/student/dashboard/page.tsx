'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface Test {
  id: string
  title: string
  subject: string
  questionCount: number
  status: string
  submittedAt: Date | null
  totalScore: number | null
  maxScore: number | null
}

export default function StudentDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/student/available-tests')
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

  const availableTests = tests.filter(t => t.status === 'NOT_STARTED')
  const inProgressTests = tests.filter(t => t.status === 'IN_PROGRESS')
  const completedTests = tests.filter(t => t.status === 'RELEASED')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600 mt-1">View your tests and check your results</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Available Tests</h3>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{availableTests.length}</p>
            <p className="text-sm text-gray-500 mt-1">Assigned tests</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{inProgressTests.length}</p>
            <p className="text-sm text-gray-500 mt-1">Tests</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{completedTests.length}</p>
            <p className="text-sm text-gray-500 mt-1">Tests</p>
          </div>
        </div>

        {/* My Tests */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-bold text-gray-900">My Tests</h2>
          </div>

          {tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg mb-2">No tests taken yet</p>
              <p className="text-gray-400 text-sm">Available tests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{test.title}</h3>
                      <p className="text-sm text-gray-600">{test.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      test.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                      test.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {test.status === 'RELEASED' ? 'Graded' :
                       test.status === 'IN_PROGRESS' ? 'In Progress' :
                       'Available'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>📝 {test.questionCount} questions</span>
                    {test.totalScore !== null && (
                      <span className="font-semibold text-primary-600">
                        Score: {test.totalScore}/{test.maxScore}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {test.status === 'NOT_STARTED' && (
                      <button
                        onClick={() => router.push(`/student/test/${test.id}`)}
                        className="btn-primary text-sm"
                      >
                        Start Test
                      </button>
                    )}
                    {test.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => router.push(`/student/test/${test.id}`)}
                        className="btn-primary text-sm"
                      >
                        Continue Test
                      </button>
                    )}
                    {test.status === 'RELEASED' && (
                      <button
                        onClick={() => router.push(`/student/results/${test.id}`)}
                        className="btn-primary text-sm"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Schedule */}
        <div className="card mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <h2 className="text-xl font-bold text-gray-900">My Schedule</h2>
            </div>
            <button
              onClick={() => router.push('/student/schedule')}
              className="btn-primary text-sm"
            >
              View Full Schedule
            </button>
          </div>
          <p className="text-gray-600 text-sm">View your weekly class timetable</p>
        </div>
      </div>
    </div>
  )
}
