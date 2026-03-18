'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface GradeComponent {
  id: string
  name: string
  type: string
  weight: number
  maxScore: number
}

interface Student {
  id: string
  name: string
  email: string
}

interface Grade {
  componentId: string
  studentId: string
  score: number | null
}

interface Course {
  code: string
  name: string
}

export default function EnterGradesPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [components, setComponents] = useState<GradeComponent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      const [courseRes, componentsRes, studentsRes, gradesRes] = await Promise.all([
        fetch(`/api/teacher/courses/${courseId}`),
        fetch(`/api/teacher/courses/${courseId}/components`),
        fetch(`/api/teacher/courses/${courseId}/students`),
        fetch(`/api/teacher/courses/${courseId}/grades`)
      ])

      const courseData = await courseRes.json()
      const componentsData = await componentsRes.json()
      const studentsData = await studentsRes.json()
      const gradesData = await gradesRes.json()

      if (courseData.success) setCourse(courseData.course)
      if (componentsData.success) setComponents(componentsData.components)
      if (studentsData.success) setStudents(studentsData.students)

      if (gradesData.success) {
        const gradesMap: Record<string, number | null> = {}
        gradesData.grades.forEach((grade: Grade) => {
          const key = `${grade.studentId}-${grade.componentId}`
          gradesMap[key] = grade.score
        })
        setGrades(gradesMap)
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (studentId: string, componentId: string, value: string) => {
    const key = `${studentId}-${componentId}`
    const numValue = value === '' ? null : parseFloat(value)
    setGrades({ ...grades, [key]: numValue })
  }

  const calculateStudentAverage = (studentId: string) => {
    let totalWeighted = 0
    let totalWeight = 0

    components.forEach(component => {
      const key = `${studentId}-${component.id}`
      const score = grades[key]
      
      if (score !== null && score !== undefined) {
        const percentage = (score / component.maxScore) * 100
        totalWeighted += percentage * component.weight
        totalWeight += component.weight
      }
    })

    if (totalWeight === 0) return null
    return (totalWeighted / totalWeight).toFixed(1)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const gradeEntries = Object.entries(grades).map(([key, score]) => {
        const [studentId, componentId] = key.split('-')
        return { studentId, componentId, score }
      })

      const response = await fetch(`/api/teacher/courses/${courseId}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradeEntries })
      })

      if (response.ok) {
        alert('Grades saved successfully!')
        router.push(`/teacher/gradebook/${courseId}`)
      }
    } catch (error) {
      alert('Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!course || components.length === 0 || students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {!course && 'Course not found'}
            {course && components.length === 0 && 'No grade components. Please add components first.'}
            {course && components.length > 0 && students.length === 0 && 'No students enrolled.'}
          </p>
          <button onClick={() => router.push(`/teacher/gradebook/${courseId}`)} className="btn-primary">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Enter Grades</h1>
              <p className="text-sm text-gray-600">{course.code} - {course.name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save All'}
              </button>
              <button
                onClick={() => router.push(`/teacher/gradebook/${courseId}`)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  Student
                </th>
                {components.map(component => (
                  <th key={component.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <div>{component.name}</div>
                    <div className="text-gray-400 font-normal">
                      {component.type} ({(component.weight * 100).toFixed(0)}%)
                    </div>
                    <div className="text-gray-400 font-normal">
                      Max: {component.maxScore}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => {
                const average = calculateStudentAverage(student.id)
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                      <div>{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </td>
                    {components.map(component => {
                      const key = `${student.id}-${component.id}`
                      const value = grades[key]
                      
                      return (
                        <td key={component.id} className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={component.maxScore}
                            step="0.5"
                            className="input-field text-center w-20"
                            placeholder="-"
                            value={value === null || value === undefined ? '' : value}
                            onChange={(e) => handleGradeChange(student.id, component.id, e.target.value)}
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center font-semibold bg-green-50">
                      {average !== null ? `${average}%` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : '💾 Save All Grades'}
          </button>
        </div>
      </div>
    </div>
  )
}
