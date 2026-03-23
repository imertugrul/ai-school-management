'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Student {
  id: string
  name: string
  email: string
}

interface CourseAssignment {
  id: string
  weeklyHours: number
  course: { code: string; name: string }
  teacher: { name: string }
}

interface ClassDetail {
  id: string
  name: string
  grade: string | null
  section: string | null
  students: Student[]
  courseAssignments: CourseAssignment[]
}

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [cls, setCls] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`/api/admin/classes/${classId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setCls(data.class) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [classId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Class not found</h3>
          <p className="text-gray-500 text-sm mb-6">This class may have been deleted</p>
          <button onClick={() => router.push('/manage-panel/classes')} className="btn-primary">
            Back to Classes
          </button>
        </div>
      </div>
    )
  }

  const filteredStudents = cls.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/manage-panel/classes')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Classes
              </button>
              <span className="text-gray-300">/</span>
              <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">{cls.name[0]}</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Class {cls.name}</h1>
                {cls.grade && (
                  <p className="text-xs text-gray-500">Grade {cls.grade}{cls.section ? ` · Section ${cls.section}` : ''}</p>
                )}
              </div>
            </div>
            <button onClick={() => router.push('/manage-panel')} className="btn-secondary text-sm">
              ← Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{cls.students.length}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Students Enrolled</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-50 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{cls.courseAssignments.length}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Assigned Courses</p>
            </div>
          </div>
        </div>

        {/* Course Assignments */}
        {cls.courseAssignments.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-l-4 border-purple-500 pl-4">Assigned Courses</h2>
            <div className="divide-y divide-gray-100">
              {cls.courseAssignments.map(a => (
                <div key={a.id} className="py-3 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      {a.course.code}
                    </span>
                    <span className="font-medium text-gray-700">{a.course.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs">👨‍🏫</span>
                      {a.teacher.name}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{a.weeklyHours}h/week</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 border-l-4 border-blue-500 pl-4">
              Students
              <span className="ml-2 text-sm font-normal text-gray-400">({cls.students.length})</span>
            </h2>
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field w-48 text-sm py-2"
            />
          </div>

          {cls.students.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
              <p className="text-gray-500 text-sm mb-6">Assign students to this class from the Students page</p>
              <button
                onClick={() => router.push('/manage-panel/students')}
                className="btn-primary text-sm"
              >
                Go to Students
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center py-6 text-gray-400 text-sm">No students match your search.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student, i) => (
                <div key={student.id} className="py-3 flex items-center gap-4 hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                  <span className="text-sm text-gray-300 w-6 text-right font-medium">{i + 1}</span>
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-semibold">{getInitials(student.name)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-400">{student.email}</p>
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
