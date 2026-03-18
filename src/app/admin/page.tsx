x'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Admin Panel</h1>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h2>
          <p className="text-gray-600">Manage your school operations</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Student Management */}
          <button
            onClick={() => router.push('/admin/students')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">👨‍🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Students</h3>
            <p className="text-gray-600 text-sm">
              Add, edit, and manage student records
            </p>
          </button>

          {/* Class Management */}
          <button
            onClick={() => router.push('/admin/classes')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Classes</h3>
            <p className="text-gray-600 text-sm">
              Create and organize classes
            </p>
          </button>

          {/* Teacher Management */}
          <button
            onClick={() => router.push('/admin/teachers')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">👨‍🏫</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Teachers</h3>
            <p className="text-gray-600 text-sm">
              Add and manage teaching staff
            </p>
          </button>

          {/* Course Management */}
          <button
            onClick={() => router.push('/admin/courses')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Courses</h3>
            <p className="text-gray-600 text-sm">
              Create and organize courses
            </p>
          </button>

          {/* Course Assignments (AI) */}
          <button
            onClick={() => router.push('/admin/course-assignments')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200"
          >
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Course Assignments (AI)</h3>
            <p className="text-gray-600 text-sm">
              Auto-assign courses to teachers with AI
            </p>
          </button>

          {/* Schedule Management */}
          <button
            onClick={() => router.push('/admin/schedules')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Schedules</h3>
            <p className="text-gray-600 text-sm">
              View and manage class schedules
            </p>
          </button>

          {/* School Settings */}
          <button
            onClick={() => router.push('/admin/school-settings')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200"
          >
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">School Settings</h3>
            <p className="text-gray-600 text-sm">
              Configure school hours and breaks
            </p>
          </button>

          {/* Tests Management */}
          <button
            onClick={() => router.push('/admin/tests')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Tests</h3>
            <p className="text-gray-600 text-sm">
              Create and grade tests
            </p>
          </button>

          {/* Analytics */}
          <button
            onClick={() => router.push('/admin/analytics')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              View school performance data
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}