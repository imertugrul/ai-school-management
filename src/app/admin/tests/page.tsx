'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Test {
  id: string
  title: string
  subject: string | null
  isActive: boolean
  accessCode: string
  createdAt: string
  teacher: {
    id: string
    name: string
  }
  questionsCount: number
  submittedCount: number
  avgScore: number | null
}

export default function AdminTestsPage() {
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/admin/tests')
      const data = await response.json()

      if (data.success) {
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/tests?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Test deleted successfully!')
        fetchTests()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete test')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred!')
    }
  }

  // Get unique teachers for the filter dropdown
  const uniqueTeachers = Array.from(
    new Map(tests.map((t) => [t.teacher.id, t.teacher])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeacher = selectedTeacher === '' || test.teacher.id === selectedTeacher
    return matchesSearch && matchesTeacher
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading tests...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Test Management</h1>
            <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">
              Back to Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Teacher
              </label>
              <select
                className="input-field"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">All Teachers</option>
                {uniqueTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tests List */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            Tests ({filteredTests.length}
            {filteredTests.length !== tests.length ? ` of ${tests.length}` : ''})
          </h2>

          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-4xl mb-3">📝</p>
              <p className="text-gray-500 font-medium">
                {tests.length === 0 ? 'No tests found in this school' : 'No tests match your filters'}
              </p>
              {tests.length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedTeacher('')
                  }}
                  className="btn-secondary text-sm mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{test.title}</h3>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                            test.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {test.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{test.teacher.name}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium ml-3 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {test.subject && (
                      <div>
                        <span className="text-gray-400">Subject:</span>{' '}
                        <span className="text-gray-700">{test.subject}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Questions:</span>{' '}
                      <span className="text-gray-700 font-medium">{test.questionsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Submitted:</span>{' '}
                      <span className="text-gray-700 font-medium">{test.submittedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Score:</span>{' '}
                      <span
                        className={`font-medium ${
                          test.avgScore === null
                            ? 'text-gray-400'
                            : test.avgScore >= 70
                            ? 'text-green-600'
                            : 'text-red-500'
                        }`}
                      >
                        {test.avgScore !== null ? `${test.avgScore}%` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Code: <span className="font-mono font-medium">{test.accessCode}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(test.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
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
