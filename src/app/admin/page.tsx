'use client'

import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Admin Panel</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Class Management */}
          <button
            onClick={() => router.push('/admin/classes')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">🏫</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Class Management</h3>
            <p className="text-gray-600">
              Create, edit, and manage classes
            </p>
          </button>

          {/* Student Management */}
          <button
            onClick={() => router.push('/admin/students')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Student Management</h3>
            <p className="text-gray-600">
              View students and assign to classes
            </p>
          </button>

          {/* Teacher Management */}
          <button
            onClick={() => router.push('/admin/teachers')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Teacher Management</h3>
            <p className="text-gray-600">
              View and manage teachers
            </p>
          </button>

          <button
            onClick={() => router.push('/admin/courses')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Courses</h3>
            <p className="text-gray-600 text-sm">
              Create and manage school courses
            </p>
          </button>

          {/* CSV Import */}
          <button
            onClick={() => router.push('/admin/import')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk Import</h3>
            <p className="text-gray-600">
              Import users via CSV
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
