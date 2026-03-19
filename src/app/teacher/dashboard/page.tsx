'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    testsCreated: 0,
    studentsGraded: 0,
    averageScore: 0,
    classesCount: 0
  })

  useEffect(() => {
    fetch('/api/teacher/stats')
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats) })
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Teacher Dashboard</h1>
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
          <p className="text-gray-600">Here's what's happening with your classes</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '📝', label: 'Tests Created',    value: stats.testsCreated },
            { icon: '👥', label: 'Submissions',       value: stats.studentsGraded },
            { icon: '🎓', label: 'Classes',           value: stats.classesCount },
            { icon: '📊', label: 'Average Score',     value: stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A' },
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
            onClick={() => router.push('/teacher/tests')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tests</h3>
            <p className="text-gray-600 text-sm">
              Create tests, assign to classes and review submissions
            </p>
          </button>

          <button
            onClick={() => router.push('/teacher/gradebook')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Grade Book</h3>
            <p className="text-gray-600 text-sm">
              Manage grade components and enter student scores
            </p>
          </button>

          <button
            onClick={() => router.push('/teacher/schedule')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Schedule</h3>
            <p className="text-gray-600 text-sm">
              View your weekly teaching schedule
            </p>
          </button>

          <button
            onClick={() => router.push('/teacher/attendance')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Attendance</h3>
            <p className="text-gray-600 text-sm">
              Mark and manage student attendance
            </p>
          </button>

          <button
            onClick={() => router.push('/teacher/analytics')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              View class performance and insights
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
