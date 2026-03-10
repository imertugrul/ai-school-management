'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Submission {
  id: string
  status: string
  startedAt: string
  currentQuestionIndex: number
  tabSwitchCount: number
  lastActiveAt: string
  student: {
    name: string
    email: string
  }
  test: {
    questions: any[]
  }
}

export default function MonitorTestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [test, setTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [testId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}/submissions`)
      const data = await response.json()
      
      if (data.success) {
        setSubmissions(data.submissions)
        if (data.submissions.length > 0) {
          setTest(data.submissions[0].test)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const inProgress = submissions.filter(s => s.status === 'IN_PROGRESS')
  const submitted = submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED')
  const suspicious = submissions.filter(s => s.tabSwitchCount > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">🔴 Live Monitor</h1>
            <button onClick={() => router.push('/teacher/tests')} className="btn-secondary">
              ← Back to Tests
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-gray-900">{submissions.length}</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">{inProgress.length}</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Submitted</h3>
            <p className="text-3xl font-bold text-green-600">{submitted.length}</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Suspicious Activity</h3>
            <p className="text-3xl font-bold text-yellow-600">{suspicious.length}</p>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-2 text-sm text-gray-600">
            <span className="animate-pulse">🔴</span>
            Auto-refreshing every 5 seconds
          </span>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No students have started this test yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => {
              const progress = test 
                ? ((submission.currentQuestionIndex + 1) / test.questions.length) * 100
                : 0

              return (
                <div 
                  key={submission.id} 
                  className={`
                    card transition-all
                    ${submission.status === 'IN_PROGRESS' ? 'border-l-4 border-blue-500' : ''}
                    ${submission.status === 'SUBMITTED' ? 'border-l-4 border-green-500 bg-green-50' : ''}
                    ${submission.tabSwitchCount > 3 ? 'bg-yellow-50' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {submission.student.name}
                        </h3>
                        
                        {submission.status === 'IN_PROGRESS' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            In Progress
                          </span>
                        )}
                        
                        {submission.status === 'SUBMITTED' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Submitted
                          </span>
                        )}

                        {submission.tabSwitchCount > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            ⚠️ {submission.tabSwitchCount} tab switches
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{submission.student.email}</p>

                      {submission.status === 'IN_PROGRESS' && (
                        <>
                          <div className="mb-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Question {submission.currentQuestionIndex + 1} of {test?.questions.length || 0}</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <p className="text-xs text-gray-500">
                            Last active: {getTimeSince(submission.lastActiveAt)}
                          </p>
                        </>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Started: {new Date(submission.startedAt).toLocaleString('en-US')}
                      </p>
                    </div>
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
