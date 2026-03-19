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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!cls) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Class not found</div>
  }

  const filteredStudents = cls.students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/classes')} className="text-gray-400 hover:text-gray-600">
                ← Classes
              </button>
              <span className="text-gray-300">/</span>
              <h1 className="text-2xl font-bold text-primary-600">Class {cls.name}</h1>
              {cls.grade && (
                <span className="text-sm bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  Grade {cls.grade}
                </span>
              )}
            </div>
            <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">
              ← Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card flex items-center gap-4">
            <div className="text-4xl">👥</div>
            <div>
              <p className="text-sm text-gray-500">Students</p>
              <p className="text-3xl font-bold text-gray-900">{cls.students.length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="text-4xl">📚</div>
            <div>
              <p className="text-sm text-gray-500">Courses</p>
              <p className="text-3xl font-bold text-gray-900">{cls.courseAssignments.length}</p>
            </div>
          </div>
        </div>

        {/* Course Assignments */}
        {cls.courseAssignments.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Assigned Courses</h2>
            <div className="divide-y divide-gray-100">
              {cls.courseAssignments.map(a => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{a.course.code}</span>
                    <span className="text-gray-500 ml-2">{a.course.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👨‍🏫 {a.teacher.name}</span>
                    <span>{a.weeklyHours}h/week</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Students
              <span className="ml-2 text-sm font-normal text-gray-400">({cls.students.length})</span>
            </h2>
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field w-48 text-sm py-1.5"
            />
          </div>

          {cls.students.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">👤</p>
              <p>No students in this class yet.</p>
              <button
                onClick={() => router.push('/admin/students')}
                className="btn-primary text-sm mt-4"
              >
                Go to Students
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center py-6 text-gray-400 text-sm">No students match your search.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student, i) => (
                <div key={student.id} className="py-3 flex items-center gap-4">
                  <span className="text-sm text-gray-300 w-6 text-right">{i + 1}</span>
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
