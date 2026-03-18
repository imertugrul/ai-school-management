'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CourseGrade {
  course: {
    id: string
    code: string
    name: string
  }
  components: {
    id: string
    name: string
    type: string
    weight: number
    maxScore: number
    grade: {
      score: number
    } | null
  }[]
  average: number | null
  totalWeight: number
}

export default function StudentGradesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [overallGPA, setOverallGPA] = useState<number | null>(null)

  useEffect(() => {
    fetchGrades()
  }, [])

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/student/grades')
      const data = await response.json()
      
      if (data.success) {
        setCourses(data.courses)
        setOverallGPA(data.overallGPA)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (percentage: number | null) => {
    if (percentage === null) return 'text-gray-600'
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeLetter = (percentage: number | null) => {
    if (percentage === null) return '-'
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Grades</h1>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="btn-secondary text-sm"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overall GPA */}
        {overallGPA !== null && (
          <div className="card mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Overall Average</p>
              <p className={`text-5xl font-bold ${getGradeColor(overallGPA)}`}>
                {overallGPA.toFixed(1)}%
              </p>
              <p className="text-2xl font-semibold text-gray-700 mt-2">
                Grade: {getGradeLetter(overallGPA)}
              </p>
            </div>
          </div>
        )}

        {/* Courses */}
        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500">No grades available yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((courseGrade) => (
              <div key={courseGrade.course.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {courseGrade.course.code}
                    </h2>
                    <p className="text-gray-600">{courseGrade.course.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Grade</p>
                    <p className={`text-3xl font-bold ${getGradeColor(courseGrade.average)}`}>
                      {courseGrade.average !== null ? `${courseGrade.average.toFixed(1)}%` : '-'}
                    </p>
                    <p className="text-lg font-semibold text-gray-700">
                      {getGradeLetter(courseGrade.average)}
                    </p>
                  </div>
                </div>

                {courseGrade.totalWeight !== 1 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Grade weights total {(courseGrade.totalWeight * 100).toFixed(0)}% (should be 100%)
                    </p>
                  </div>
                )}

                {/* Grade Components */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Assignment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Score
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Weight
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseGrade.components.map((component) => {
                        const score = component.grade?.score ?? null
                        const percentage = score !== null ? (score / component.maxScore) * 100 : null
                        
                        return (
                          <tr key={component.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {component.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {component.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {score !== null ? (
                                <span className="font-semibold">
                                  {score} / {component.maxScore}
                                </span>
                              ) : (
                                <span className="text-gray-400">Not graded</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center">
                              {(component.weight * 100).toFixed(0)}%
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {percentage !== null ? (
                                <span className={`font-semibold ${getGradeColor(percentage)}`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

