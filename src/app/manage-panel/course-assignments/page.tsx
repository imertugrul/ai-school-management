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

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null)

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

  const downloadTemplate = () => {
    const csv = 'teacher_email,course_code,class_name,weekly_hours\nteacher@school.com,MATH9,9A,4\nteacher2@school.com,PHY10,10B,3'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'course-assignments-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return row
    }).filter(r => r.teacher_email || r.course_code)
  }

  const handleImport = async () => {
    if (!csvFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await csvFile.text()
      const rows = parseCSV(text)
      const response = await fetch('/api/admin/course-assignments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      })
      const data = await response.json()
      if (data.success) {
        setImportResult(data.results)
        setCsvFile(null)
        fetchData()
      } else {
        setImportResult({ success: 0, skipped: 0, errors: [data.error] })
      }
    } catch (err) {
      setImportResult({ success: 0, skipped: 0, errors: ['Failed to import'] })
    } finally {
      setImporting(false)
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const groupedByTeacher = assignments.reduce((acc, assignment) => {
    const tid = assignment.teacher.id
    if (!acc[tid]) acc[tid] = { teacher: assignment.teacher, assignments: [] }
    acc[tid].assignments.push(assignment)
    return acc
  }, {} as Record<string, { teacher: Assignment['teacher'], assignments: Assignment[] }>)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Course Assignments</h1>
                <p className="text-xs text-gray-500">Assign courses and classes to teachers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/manage-panel')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
              <button onClick={() => { setShowForm(true); setError('') }} className="btn-primary">
                + New Assignment
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* CSV Import */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Import via CSV</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload a CSV to assign multiple courses at once.
                Columns: <code className="bg-gray-100 px-1.5 py-0.5 rounded-lg text-xs font-mono">teacher_email, course_code, class_name, weekly_hours</code>
              </p>
            </div>
            <button onClick={downloadTemplate} className="btn-secondary text-sm whitespace-nowrap">
              Download Template
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors">
              <span className="text-2xl">📂</span>
              <span className="text-sm text-gray-600">
                {csvFile ? csvFile.name : 'Click to select CSV file...'}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { setCsvFile(e.target.files?.[0] || null); setImportResult(null) }}
              />
            </label>
            <button
              onClick={handleImport}
              disabled={!csvFile || importing}
              className="btn-primary disabled:opacity-50 whitespace-nowrap"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>

          {importResult && (
            <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl border text-sm ${importResult.success > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <div>
                <p className="font-semibold mb-1">
                  ✓ {importResult.success} imported &nbsp;·&nbsp; ⏭ {importResult.skipped} skipped
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="text-xs text-red-600 space-y-0.5 mt-2">
                    {importResult.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
                    {importResult.errors.length > 10 && <li>...and {importResult.errors.length - 10} more</li>}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* New Assignment Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">New Assignment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="text-red-500 text-base mt-0.5">⚠</span>
                  <span>{error}</span>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              All Assignments
              <span className="ml-2 text-sm font-normal text-gray-400">({assignments.length})</span>
            </h2>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No course assignments yet</h3>
              <p className="text-gray-500 text-sm mb-6">Create your first assignment to get started</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                + Create First Assignment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedByTeacher).map(({ teacher, assignments: teacherAssignments }) => (
                <div key={teacher.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{teacher.name}</span>
                        {teacher.subject && (
                          <span className="ml-2 text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                            {teacher.subject}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {teacherAssignments.length} assignment{teacherAssignments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAllForTeacher(teacher.id, teacher.name)}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold"
                    >
                      Delete All
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {teacherAssignments.map(a => (
                      <div key={a.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {a.course.code}
                          </span>
                          <span className="font-medium text-gray-700">{a.course.name}</span>
                          {a.class && (
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold">
                              {a.class.name}
                            </span>
                          )}
                          <span className="text-gray-400 text-xs">{a.weeklyHours}h/week</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-semibold"
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
