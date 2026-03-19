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
    attendanceRate: 0,
    pendingTests: 0
  })

  useEffect(() => {
    fetch('/api/student/stats')
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats) })
      .catch(console.error)
  }, [])

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '📚', label: 'Courses',        value: stats.coursesEnrolled },
            { icon: '📊', label: 'Average Grade',   value: stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A' },
            { icon: '✅', label: 'Attendance',      value: stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : 'N/A' },
            { icon: '📝', label: 'Pending Tests',   value: stats.pendingTests },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3">
              <div className="text-3xl">{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
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
              View and take your assigned tests
            </p>
          </button>

          <button
            onClick={() => router.push('/student/results')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Test Results</h3>
            <p className="text-gray-600 text-sm">
              View your graded test scores and feedback
            </p>
          </button>

          <button
            onClick={() => router.push('/student/grades')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
          >
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Grades</h3>
            <p className="text-gray-600 text-sm">
              View course grades and weighted averages
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
            onClick={() => router.push('/student/analytics')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              Track your overall academic performance
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
