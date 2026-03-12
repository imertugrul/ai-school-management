'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  code: string
  name: string
  description: string | null
  credits: number
  grade: string | null
  weeklyHours: number
  _count: {
    enrollments: number
    schedules: number
  }
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<any>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '3',
    grade: '',
    weeklyHours: '4'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      
      if (data.success) {
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create course')
        return
      }

      setShowForm(false)
      setFormData({ code: '', name: '', description: '', credits: '3', grade: '', weeklyHours: '4' })
      fetchCourses()
    } catch (error) {
      setError('Something went wrong')
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const course: any = {}
      headers.forEach((header, index) => {
        course[header] = values[index]
      })
      return course
    })
  }

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return

    setImportResults(null)

    try {
      const text = await csvFile.text()
      const courses = parseCSV(text)

      const response = await fetch('/api/admin/import-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses })
      })

      const data = await response.json()

      if (data.success) {
        setImportResults(data.results)
        setCsvFile(null)
        fetchCourses()
      }
    } catch (error) {
      alert('Failed to import courses')
    }
  }

  const downloadTemplate = () => {
    const template = 'code,name,description,credits,grade,weeklyHours\nMATH101,Introduction to Calculus,Basic calculus concepts,3,10,4\nPHYS201,Physics I,Mechanics and thermodynamics,4,11,3\nCHEM101,Chemistry Basics,Introduction to chemistry,3,9,4'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'courses-template.csv'
    a.click()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete related schedules and assignments.')) return

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        alert('Course deleted!')
        fetchCourses()
      } else {
        alert(data.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete course')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-1">Create and manage courses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowImportForm(true)}
              className="btn-secondary"
            >
              📥 Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              ➕ Create Course
            </button>
          </div>
        </div>

        {/* CSV Import Form */}
        {showImportForm && (
          <div className="card mb-6 border-2 border-blue-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📥 Import Courses from CSV</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>CSV Format:</strong> code, name, description, credits, grade, weeklyHours
              </p>
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                📄 Download Template CSV
              </button>
            </div>

            <form onSubmit={handleCSVUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="input-field"
                />
              </div>

              {importResults && (
                <div className={`border rounded-lg p-4 ${
                  importResults.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <p className="font-semibold mb-2">Import Results:</p>
                  <p className="text-sm">✅ Success: {importResults.success}</p>
                  <p className="text-sm">❌ Failed: {importResults.failed}</p>
                  {importResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Errors:</p>
                      <ul className="text-xs list-disc list-inside">
                        {importResults.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!csvFile}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload & Import
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportForm(false)
                    setImportResults(null)
                    setCsvFile(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Course Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Course</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., MATH101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., Introduction to Calculus"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="input-field"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    className="input-field"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  >
                    <option value="">All Grades</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="input-field"
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Create Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Courses ({courses.length})</h2>
          
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 mb-4">No courses yet</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowImportForm(true)} className="btn-secondary">
                  📥 Import CSV
                </button>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Create First Course
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weekly Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-primary-600">{course.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{course.name}</div>
                        {course.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{course.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.grade || 'All'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.weeklyHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course._count.enrollments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course._count.schedules}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
