'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  code: string
  name: string
  class: {
    id: string
    name: string
  } | null
}

export default function TeacherGradeBookPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/teacher/courses')
      const data = await response.json()
      
      if (data.success) {
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-primary-600">Grade Book</h1>
            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="btn-secondary text-sm"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h2>
          <p className="text-gray-600">Select a course to manage grades</p>
        </div>

        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500">No courses assigned yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => router.push(`/teacher/gradebook/${course.id}`)}
                className="card hover:shadow-lg transition-shadow text-left"
              >
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {course.code}
                </h3>
                <p className="text-gray-600 text-sm mb-2">{course.name}</p>
                {course.class && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {course.class.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
