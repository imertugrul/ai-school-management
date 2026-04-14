'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Course {
  id: string
  code: string
  name: string
  class: {
    id: string
    name: string
  } | null
}

const COURSE_GRADIENTS = [
  { gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', bg: 'bg-purple-50', hover: 'hover:border-purple-300', text: 'text-purple-700' },
  { gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', bg: 'bg-blue-50', hover: 'hover:border-blue-300', text: 'text-blue-700' },
  { gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/30', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300', text: 'text-indigo-700' },
  { gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/30', bg: 'bg-violet-50', hover: 'hover:border-violet-300', text: 'text-violet-700' },
  { gradient: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/30', bg: 'bg-teal-50', hover: 'hover:border-teal-300', text: 'text-teal-700' },
  { gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300', text: 'text-emerald-700' },
]

export default function TeacherGradeBookPage() {
  const router = useRouter()
  const { t } = useLanguage()
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('dashboard.teacher.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📚</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('dashboard.teacher.gradebookTitle')}</h1>
                <p className="text-xs text-gray-500">{t('dashboard.teacher.gradebookSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {t('dashboard.teacher.back')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.teacher.myCourses')}</h2>
          <p className="text-gray-500">{t('dashboard.teacher.myCoursesSubtitle')}</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.teacher.noCourses')}</h3>
            <p className="text-gray-500 text-sm">{t('dashboard.teacher.noCoursesDesc')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => {
              const style = COURSE_GRADIENTS[i % COURSE_GRADIENTS.length]
              return (
                <button
                  key={course.id}
                  onClick={() => router.push(`/teacher/gradebook/${course.id}`)}
                  className={`group relative overflow-hidden text-left rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-xl ${style.hover} hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-${style.bg.split('-')[1]}-50/0 to-${style.bg.split('-')[1]}-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative">
                    <div className={`w-14 h-14 bg-gradient-to-br ${style.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${style.shadow} group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white text-2xl">📊</span>
                    </div>
                    <h3 className={`text-xl font-bold text-gray-900 mb-1 group-hover:${style.text} transition-colors`}>
                      {course.code}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">{course.name}</p>
                    {course.class && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {course.class.name}
                      </span>
                    )}
                    <div className="mt-4 flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('dashboard.teacher.openGradebook')} <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
