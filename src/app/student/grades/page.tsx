'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

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

const TYPE_COLORS: Record<string, string> = {
  EXAM: 'bg-red-100 text-red-800',
  QUIZ: 'bg-blue-100 text-blue-800',
  HOMEWORK: 'bg-yellow-100 text-yellow-800',
  PROJECT: 'bg-purple-100 text-purple-800',
  PARTICIPATION: 'bg-green-100 text-green-800',
}

export default function StudentGradesPage() {
  const router = useRouter()
  const { t } = useLanguage()
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
    if (percentage >= 90) return 'text-emerald-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeBg = (percentage: number | null) => {
    if (percentage === null) return 'bg-gray-100'
    if (percentage >= 90) return 'bg-emerald-500'
    if (percentage >= 80) return 'bg-blue-500'
    if (percentage >= 70) return 'bg-yellow-500'
    if (percentage >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getGradeLetter = (percentage: number | null) => {
    if (percentage === null) return '—'
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const getGradeCardStyle = (pct: number | null) => {
    if (pct === null) return 'border-gray-200'
    if (pct >= 90) return 'border-emerald-200 bg-emerald-50/30'
    if (pct >= 80) return 'border-blue-200 bg-blue-50/30'
    if (pct >= 70) return 'border-yellow-200 bg-yellow-50/30'
    if (pct >= 60) return 'border-orange-200 bg-orange-50/30'
    return 'border-red-200 bg-red-50/30'
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
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🎓</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('dashboard.student.gradesTitle')}</h1>
                <p className="text-xs text-gray-500">{t('dashboard.student.gradesSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {t('dashboard.student.back')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overall GPA */}
        {overallGPA !== null && (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 p-6 mb-8 text-white shadow-xl shadow-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">{t('dashboard.student.overallAverage')}</p>
                <p className="text-6xl font-bold tracking-tight">{overallGPA.toFixed(1)}%</p>
                <p className="text-2xl font-semibold text-white/90 mt-2">
                  Grade: {getGradeLetter(overallGPA)}
                </p>
              </div>
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-5xl font-bold text-white">{getGradeLetter(overallGPA)}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{ width: `${Math.min(overallGPA, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Courses */}
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.student.noGrades')}</h3>
            <p className="text-gray-500 text-sm">{t('dashboard.student.noGradesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((courseGrade) => (
              <div key={courseGrade.course.id} className={`rounded-2xl bg-white shadow-sm border-2 transition-all hover:shadow-md ${getGradeCardStyle(courseGrade.average)}`}>
                {/* Course header */}
                <div className="px-6 pt-6 pb-4 flex justify-between items-start border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">{courseGrade.course.code}</h2>
                      <span className={`text-2xl font-bold ${getGradeColor(courseGrade.average)}`}>
                        {getGradeLetter(courseGrade.average)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">{courseGrade.course.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">{t('dashboard.student.currentGrade')}</p>
                    <p className={`text-3xl font-bold ${getGradeColor(courseGrade.average)}`}>
                      {courseGrade.average !== null ? `${courseGrade.average.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                </div>

                {/* Progress bar for course */}
                {courseGrade.average !== null && (
                  <div className="px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getGradeBg(courseGrade.average)}`}
                          style={{ width: `${Math.min(courseGrade.average, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 w-10 text-right">
                        {courseGrade.average.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                {courseGrade.totalWeight !== 1 && (
                  <div className="mx-6 mt-4">
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                      <span>⚠</span>
                      <span>{t('dashboard.student.gradeWeightWarning')} {(courseGrade.totalWeight * 100).toFixed(0)}% ({t('dashboard.student.gradeWeightShouldBe')})</span>
                    </div>
                  </div>
                )}

                {/* Grade Components */}
                <div className="overflow-x-auto p-0">
                  <table className="min-w-full">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.student.assignment')}</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.student.type')}</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">{t('dashboard.student.score')}</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">{t('dashboard.student.weight')}</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">{t('dashboard.student.percentage')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {courseGrade.components.map((component) => {
                        const score = component.grade?.score ?? null
                        const percentage = score !== null ? (score / component.maxScore) * 100 : null

                        return (
                          <tr key={component.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                              {component.name}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[component.type] || 'bg-gray-100 text-gray-700'}`}>
                                {component.type}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-center">
                              {score !== null ? (
                                <span className="font-semibold text-gray-900">
                                  {score} / {component.maxScore}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">{t('dashboard.student.notGraded')}</span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500 text-center">
                              {(component.weight * 100).toFixed(0)}%
                            </td>
                            <td className="px-6 py-3 text-sm text-center">
                              {percentage !== null ? (
                                <span className={`font-bold text-base ${getGradeColor(percentage)}`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
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
