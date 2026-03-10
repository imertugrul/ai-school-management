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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Tests</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/teacher/tests/create')} 
                className="btn-primary"
              >
                + New Test
              </button>
              <button 
                onClick={() => router.push('/teacher/dashboard')} 
                className="btn-secondary"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {tests.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg mb-4">You haven't created any tests yet</p>
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

              return (
                <div key={test.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {test.title}
                        </h3>
                        
                        {test.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                            🟢 Active
                          </span>
                        ) : isScheduled ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            🕐 Scheduled
                          </span>
                        ) : isExpired ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                            ⏹️ Expired
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                            ⏸️ Inactive
                          </span>
                        )}
                      </div>

                      {test.subject && (
                        <span className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full mb-2">
                          {test.subject}
                        </span>
                      )}
                      
                      {test.description && (
                        <p className="text-gray-600 mb-4">{test.description}</p>
                      )}
                      
                      <div className="flex gap-6 text-sm text-gray-500 mb-3">
                        <span>📝 {test.questions.length} Questions</span>
                        <span>📊 {test._count.submissions} Submissions</span>
                        <span>📅 {new Date(test.createdAt).toLocaleDateString('en-US')}</span>
                      </div>

                      {(startDate || endDate) && (
                        <div className="text-sm text-gray-600 space-y-1 mb-3">
                          {startDate && (
                            <div>
                              🕐 Start: {startDate.toLocaleDateString('en-US')} {startDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                          {endDate && (
                            <div>
                              🕐 End: {endDate.toLocaleDateString('en-US')} {endDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Access Code */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-blue-900">Test Code:</span>
                            <code className="ml-2 text-2xl font-bold text-blue-600">{test.accessCode}</code>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(test.accessCode)
                              alert('Code copied!')
                            }}
                            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            📋 Copy Code
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                          <div className="text-sm text-blue-700">
                            🔗 <code className="text-xs bg-blue-100 px-2 py-1 rounded">localhost:3000/join/{test.accessCode}</code>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/join/${test.accessCode}`)
                              alert('Link copied!')
                            }}
                            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            🔗 Copy Link
                          </button>
                        </div>
                        <p className="text-xs text-blue-600">
                          Students can join using the code or link
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
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
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          ⏸️ Stop
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
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          ▶️ Start
                        </button>
                      )
                    )}

                    <button 
                      onClick={() => router.push(`/teacher/tests/${test.id}/monitor`)}
                      className="btn-primary"
                    >
                      🔴 Live Monitor
                    </button>
                    
                    <button 
                      onClick={() => router.push(`/teacher/tests/${test.id}/results`)}
                      className="btn-primary"
                    >
                      📊 Results
                    </button>

                    <button 
                      onClick={() => router.push(`/teacher/tests/${test.id}`)}
                      className="btn-primary"
                    >
                      📋 Details
                    </button>
                    
                    <button 
                      onClick={() => router.push(`/teacher/tests/${test.id}/edit`)}
                      className="btn-secondary"
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
