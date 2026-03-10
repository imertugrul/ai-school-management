'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  status: string
  submittedAt: string | null
  totalScore: number | null
  test: {
    title: string
    subject: string | null
  }
}

interface AvailableTest {
  id: string
  title: string
  subject: string | null
  description: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchSubmissions()
      fetchAvailableTests()
    }
  }, [status, router])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/student/submissions')
      const data = await response.json()
      
      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchAvailableTests = async () => {
    try {
      const response = await fetch('/api/student/available-tests')
      const data = await response.json()
      
      if (data.success) {
        setAvailableTests(data.tests)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  const completedTests = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED')
  const inProgressTests = submissions.filter(s => s.status === 'IN_PROGRESS')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">AI Grading System</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {session.user?.name}!</span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h2>
          <p className="text-gray-600">View your tests and check your results</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Available Tests</h3>
            <p className="text-4xl font-bold text-blue-600">{availableTests.length}</p>
            <p className="text-sm text-gray-500 mt-1">Assigned tests</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">In Progress</h3>
            <p className="text-4xl font-bold text-orange-600">{inProgressTests.length}</p>
            <p className="text-sm text-gray-500 mt-1">Tests</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Completed</h3>
            <p className="text-4xl font-bold text-green-600">{completedTests.length}</p>
            <p className="text-sm text-gray-500 mt-1">Tests</p>
          </div>
        </div>

        {/* Available Tests */}
        {availableTests.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">📝 Available Tests ({availableTests.length})</h2>
            <div className="space-y-4">
              {availableTests.map((test) => (
                <div key={test.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{test.title}</h3>
                      {test.subject && (
                        <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded mb-2">
                          {test.subject}
                        </span>
                      )}
                      {test.description && (
                        <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/student/test/${test.id}`)}
                      className="btn-primary"
                    >
                      Start Test →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Tests */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">📊 My Tests</h2>

          {submissions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tests taken yet</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {submission.test.title}
                      </h3>
                      {submission.test.subject && (
                        <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                          {submission.test.subject}
                        </span>
                      )}
                      <div className="mt-2 flex gap-4 text-sm text-gray-600">
                        <span className={`
                          font-medium
                          ${submission.status === 'IN_PROGRESS' ? 'text-blue-600' : ''}
                          ${submission.status === 'SUBMITTED' ? 'text-green-600' : ''}
                          ${submission.status === 'GRADED' ? 'text-primary-600' : ''}
                        `}>
                          {submission.status === 'IN_PROGRESS' ? '📝 In Progress' : ''}
                          {submission.status === 'SUBMITTED' ? '✅ Submitted' : ''}
                          {submission.status === 'GRADED' ? '📊 Graded' : ''}
                        </span>
                        {submission.submittedAt && (
                          <span>
                            📅 {new Date(submission.submittedAt).toLocaleDateString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {submission.status === 'RELEASED' && submission.totalScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">
                            {submission.totalScore}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">points</div>
                          <button
                            onClick={() => router.push(`/student/results/${submission.id}`)}
                            className="btn-primary text-sm"
                          >
                            View Results
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}