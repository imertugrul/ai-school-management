'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface GradeComponent {
  id: string
  name: string
  type: string
  weight: number
  maxScore: number
  date: string | null
}

interface Student {
  id: string
  name: string
  email: string
}

interface Course {
  id: string
  code: string
  name: string
  class: {
    id: string
    name: string
  } | null
}

export default function CourseGradeBookPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [components, setComponents] = useState<GradeComponent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showComponentForm, setShowComponentForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXAM',
    weight: '30',
    maxScore: '100',
    date: ''
  })

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const [courseRes, componentsRes, studentsRes] = await Promise.all([
        fetch(`/api/teacher/courses/${courseId}`),
        fetch(`/api/teacher/courses/${courseId}/components`),
        fetch(`/api/teacher/courses/${courseId}/students`)
      ])

      const courseData = await courseRes.json()
      const componentsData = await componentsRes.json()
      const studentsData = await studentsRes.json()

      if (courseData.success) setCourse(courseData.course)
      if (componentsData.success) setComponents(componentsData.components)
      if (studentsData.success) setStudents(studentsData.students)

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/teacher/courses/${courseId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight) / 100,
          maxScore: parseFloat(formData.maxScore)
        })
      })

      if (response.ok) {
        setShowComponentForm(false)
        setFormData({ name: '', type: 'EXAM', weight: '30', maxScore: '100', date: '' })
        fetchCourseData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
          <button onClick={() => router.push('/teacher/gradebook')} className="btn-primary mt-4">
            ← Back to Courses
          </button>
        </div>
      </div>
    )
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">{course.code}</h1>
              <p className="text-sm text-gray-600">{course.name}</p>
            </div>
            <button
              onClick={() => router.push('/teacher/gradebook')}
              className="btn-secondary text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Grade Components */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Grade Components</h2>
              <p className="text-sm text-gray-600">
                Total Weight: {(totalWeight * 100).toFixed(0)}%
                {totalWeight !== 1 && (
                  <span className="ml-2 text-yellow-600 font-semibold">
                    ⚠️ Should equal 100%
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowComponentForm(true)}
              className="btn-primary text-sm"
            >
              ➕ Add Component
            </button>
          </div>

          {showComponentForm && (
            <form onSubmit={handleCreateComponent} className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">New Grade Component</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., Midterm Exam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    className="input-field"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="EXAM">Exam</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="HOMEWORK">Homework</option>
                    <option value="PROJECT">Project</option>
                    <option value="PARTICIPATION">Participation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    className="input-field"
                    placeholder="30"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Score *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-field"
                    placeholder="100"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary text-sm">
                  Create Component
                </button>
                <button
                  type="button"
                  onClick={() => setShowComponentForm(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {components.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No grade components yet. Add one to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {components.map((component) => (
                    <tr key={component.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {component.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {component.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(component.weight * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {component.maxScore}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {component.date ? new Date(component.date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Students ({students.length})
            </h2>
            {components.length > 0 && (
              <button
                onClick={() => router.push(`/teacher/gradebook/${courseId}/enter-grades`)}
                className="btn-primary text-sm"
              >
                📝 Enter Grades
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students enrolled in this class
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        -
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
