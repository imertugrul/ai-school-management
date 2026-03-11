'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function TeacherDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    pendingGrading: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tests')
      const data = await response.json()
      
      if (data.tests) {
        const total = data.tests.length
        const active = data.tests.filter((t: any) => t.isActive).length
        const pending = data.tests.reduce((sum: number, test: any) => 
          sum + test.submissions.filter((s: any) => s.status === 'SUBMITTED').length, 0
        )
        
        setStats({ totalTests: total, activeTests: active, pendingGrading: pending })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {session?.user?.name}!</p>
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
              <h3 className="text-sm font-medium text-gray-600">Total Tests</h3>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Tests</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.activeTests}</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pending Grading</h3>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingGrading}</p>
          </div>
        </div>

        {/* New Feature Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-2">✨ New Feature: Attendance System!</h3>
          <p className="text-green-700">
            Take daily attendance and AI will automatically notify parents about absences and late arrivals.
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/teacher/tests/create')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <div className="text-4xl mb-3">➕</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Test</h3>
              <p className="text-gray-600 text-sm">
                Create a new test with AI grading
              </p>
            </button>

            <button
              onClick={() => router.push('/teacher/tests')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">View Tests</h3>
              <p className="text-gray-600 text-sm">
                Manage and grade submitted tests
              </p>
            </button>

            <button
              onClick={() => router.push('/teacher/attendance')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left bg-green-50 border-2 border-green-200"
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Take Attendance</h3>
              <p className="text-gray-600 text-sm">
                Mark daily attendance and notify parents
              </p>
            </button>

            <button
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left opacity-75"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Students</h3>
              <p className="text-gray-600 text-sm">
                Manage students and track progress
              </p>
              <span className="text-xs text-gray-500 mt-2 block">Coming Soon</span>
            </button>

            <button
              onClick={() => router.push('/teacher/analytics')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <div className="text-4xl mb-3">📈</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 text-sm">
                View performance metrics and insights
              </p>
            </button>

            <button
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left opacity-75"
            >
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600 text-sm">
                View and manage class timetable
              </p>
              <span className="text-xs text-gray-500 mt-2 block">Coming Soon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}