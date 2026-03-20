'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Child {
  id: string
  name: string
  email: string
  gpa: number
  attendanceRate: number
  class: { name: string } | null
  relationship: string
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(data => { if (data.success) setChildren(data.children) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const gradeColor = (gpa: number) => {
    if (gpa >= 90) return 'text-emerald-600 bg-emerald-50'
    if (gpa >= 75) return 'text-blue-600 bg-blue-50'
    if (gpa >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const sessionInitials = (session?.user?.name || 'P').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Parent Portal</h1>
                <p className="text-xs text-gray-500">Monitor your children's progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary text-sm">Logout</button>
              <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{sessionInitials}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome, {session?.user?.name}!</h2>
          <p className="text-gray-500">Here's an overview of your children's academic progress</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push('/announcements')}
            className="group relative overflow-hidden text-left rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-white text-xl">📢</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-700 transition-colors">Announcements</h3>
                <p className="text-sm text-gray-500">School news and updates</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/events')}
            className="group relative overflow-hidden text-left rounded-2xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-rose-50/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                <span className="text-white text-xl">🗓️</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-rose-700 transition-colors">Events</h3>
                <p className="text-sm text-gray-500">Upcoming school events</p>
              </div>
            </div>
          </button>
        </div>

        {/* Children */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-teal-500 pl-4">My Children</h3>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : children.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No children linked yet</h3>
            <p className="text-gray-500 text-sm">Please contact the school admin to link your children to your account.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {children.map(child => (
              <div key={child.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                    <span className="text-white text-lg font-bold">{initials(child.name)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">{child.class?.name || 'No class assigned'} · {child.relationship}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className={`text-2xl font-bold ${gradeColor(child.gpa).split(' ')[0]}`}>
                      {child.gpa > 0 ? `${child.gpa}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Average Grade</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className={`text-2xl font-bold ${child.attendanceRate >= 90 ? 'text-emerald-600' : child.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {child.attendanceRate > 0 ? `${child.attendanceRate}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Attendance</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/parent/grades?studentId=${child.id}`)}
                    className="flex-1 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    View Grades
                  </button>
                  <button
                    onClick={() => router.push(`/parent/attendance?studentId=${child.id}`)}
                    className="flex-1 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
