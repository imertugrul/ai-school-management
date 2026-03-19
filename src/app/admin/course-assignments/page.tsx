'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Assignment {
  id: string
  weeklyHours: number
  course: {
    id: string
    code: string
    name: string
  }
  teacher: {
    id: string
    name: string
    subject: string | null
  }
  class: {
    id: string
    name: string
  } | null
}

interface Course {
  id: string
  code: string
  name: string
  weeklyHours: number
}

interface Teacher {
  id: string
  name: string
  subject: string | null
}

interface Class {
  id: string
  name: string
}

export default function CourseAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    classId: '',
    weeklyHours: '4'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [assignmentsRes, coursesRes, teachersRes, classesRes] = await Promise.all([
        fetch('/api/admin/course-assignments'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/teachers'),
        fetch('/api/admin/classes')
      ])

      const [assignmentsData, coursesData, teachersData, classesData] = await Promise.all([
        assignmentsRes.json(),
        coursesRes.json(),
        teachersRes.json(),
        classesRes.json()
      ])

      if (assignmentsData.success) setAssignments(assignmentsData.assignments)
      if (coursesData.success) setCourses(coursesData.courses)
      if (teachersData.success) setTeachers(teachersData.teachers)
      if (classesData.success) setClasses(classesData.classes)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch('/api/admin/course-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create assignment')
        return
      }

      setShowForm(false)
      setFormData({ courseId: '', teacherId: '', classId: '', weeklyHours: '4' })
      fetchData()
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Delete this assignment?')) return

    try {
      await fetch(`/api/admin/course-assignments/${assignmentId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      alert('Failed to delete assignment')
    }
  }

  const handleDeleteAllForTeacher = async (teacherId: string, teacherName: string) => {
    const count = assignments.filter(a => a.teacher.id === teacherId).length
    if (!confirm(`Delete all ${count} assignments for ${teacherName}?`)) return

    try {
      await Promise.all(
        assignments
          .filter(a => a.teacher.id === teacherId)
          .map(a => fetch(`/api/admin/course-assignments/${a.id}`, { method: 'DELETE' }))
      )
      fetchData()
    } catch (error) {
      alert('Failed to delete assignments')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Group assignments by teacher
  const groupedByTeacher = assignments.reduce((acc, assignment) => {
    const tid = assignment.teacher.id
    if (!acc[tid]) acc[tid] = { teacher: assignment.teacher, assignments: [] }
    acc[tid].assignments.push(assignment)
    return acc
  }, {} as Record<string, { teacher: Assignment['teacher'], assignments: Assignment[] }>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Assignments</h1>
            <p className="text-gray-600 mt-1">Assign courses and classes to teachers</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/admin')} className="btn-secondary">
              ← Back
            </button>
            <button onClick={() => { setShowForm(true); setError('') }} className="btn-primary">
              + New Assignment
            </button>
          </div>
        </div>

        {/* New Assignment Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Assignment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.courseId}
                    onChange={(e) => {
                      const course = courses.find(c => c.id === e.target.value)
                      setFormData({
                        ...formData,
                        courseId: e.target.value,
                        weeklyHours: course ? String(course.weeklyHours) : '4'
                      })
                    }}
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} – {c.name} ({c.weeklyHours}h/week)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  >
                    <option value="">Select teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.subject ? ` (${t.subject})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    required
                    className="input-field"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  >
                    <option value="">Select class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Hours *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    className="input-field"
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create Assignment'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assignments List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              All Assignments
              <span className="ml-2 text-sm font-normal text-gray-500">({assignments.length})</span>
            </h2>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 mb-4">No course assignments yet.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                + Create First Assignment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedByTeacher).map(({ teacher, assignments: teacherAssignments }) => (
                <div key={teacher.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Teacher Header */}
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900">{teacher.name}</span>
                      {teacher.subject && (
                        <span className="ml-2 text-sm text-gray-500">({teacher.subject})</span>
                      )}
                      <span className="ml-2 text-xs text-gray-400">
                        {teacherAssignments.length} assignment{teacherAssignments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAllForTeacher(teacher.id, teacher.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete All
                    </button>
                  </div>

                  {/* Assignment Rows */}
                  <div className="divide-y divide-gray-100">
                    {teacherAssignments.map(a => (
                      <div key={a.id} className="px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium text-gray-900">{a.course.code}</span>
                          <span className="text-gray-600">{a.course.name}</span>
                          {a.class && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {a.class.name}
                            </span>
                          )}
                          <span className="text-gray-400">{a.weeklyHours}h/week</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
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
