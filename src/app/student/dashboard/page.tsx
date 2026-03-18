'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    averageGrade: 0,
    attendanceRate: 0
  })

  useEffect(() => {
    // Fetch student stats
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/student/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Student Dashboard</h1>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h2>
          <p className="text-gray-600">Here's your academic overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-4xl">📚</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courses Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.coursesEnrolled}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-4xl">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageGrade > 0 ? `${stats.averageGrade.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-4xl">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.attendanceRate > 0 ? `${stats.attendanceRate.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/student/tests')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Tests</h3>
            <p className="text-gray-600 text-sm">
              View and take assigned tests
            </p>
          </button>

          <button
            onClick={() => router.push('/student/results')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Test Results</h3>
            <p className="text-gray-600 text-sm">
              View your test scores and feedback
            </p>
          </button>

          <button
            onClick={() => router.push('/student/attendance')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Attendance</h3>
            <p className="text-gray-600 text-sm">
              View your attendance record
            </p>
          </button>

          <button
            onClick={() => router.push('/student/schedule')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Schedule</h3>
            <p className="text-gray-600 text-sm">
              View your weekly class schedule
            </p>
          </button>

          <button
            onClick={() => router.push('/student/grades')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Grades</h3>
            <p className="text-gray-600 text-sm">
              View your grades and academic progress
            </p>
          </button>

          <button
            onClick={() => router.push('/student/analytics')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Analytics</h3>
            <p className="text-gray-600 text-sm">
              Track your academic performance
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}