'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  course: {
    code: string
    name: string
  }
  teacher: {
    name: string
  }
  class: {
    name: string
  } | null
}

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function StudentSchedulePage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/student/schedule')
      const data = await response.json()
      
      if (data.success) {
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const DAYS = language === 'tr' ? DAYS_TR : DAYS_EN

  // Group schedules by day
  const schedulesByDay = DAYS.map((day, dayIndex) => ({
    day,
    schedules: schedules.filter(s => s.dayOfWeek === dayIndex).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.teacher.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.student.scheduleTitle')}</h1>
            <p className="text-gray-600 mt-1">{t('dashboard.student.scheduleSubtitle')}</p>
          </div>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="btn-secondary"
          >
            {t('dashboard.student.back')}
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 mb-2">{t('dashboard.student.noEnrolled')}</p>
            <p className="text-gray-400 text-sm">{t('dashboard.student.noEnrolledDesc')}</p>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('dashboard.student.weeklySchedule')}</h2>
            
            {/* Calendar View */}
            <div className="space-y-6">
              {schedulesByDay.map(({ day, schedules }) => (
                <div key={day}>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    {day}
                  </h3>
                  {schedules.length === 0 ? (
                    <p className="text-gray-400 text-sm ml-5">{t('dashboard.student.noClassesScheduled')}</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg ml-5"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">
                                {schedule.course.code} - {schedule.course.name}
                              </div>
                              <div className="text-sm text-gray-600 mt-1 flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  🕐 {schedule.startTime} - {schedule.endTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  👨‍🏫 {schedule.teacher.name}
                                </span>
                                {schedule.room && (
                                  <span className="flex items-center gap-1">
                                    🚪 {schedule.room}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {schedules.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{t('dashboard.student.totalClasses')}</h3>
              <p className="text-3xl font-bold text-gray-900">{schedules.length}</p>
              <p className="text-sm text-gray-500 mt-1">{t('dashboard.student.perWeek')}</p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{t('dashboard.student.enrolledCourses')}</h3>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(schedules.map(s => s.course.code)).size}
              </p>
              <p className="text-sm text-gray-500 mt-1">{t('dashboard.student.differentCourses')}</p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{t('dashboard.student.classHours')}</h3>
              <p className="text-3xl font-bold text-gray-900">
                {schedules.reduce((total, s) => {
                  const start = parseInt(s.startTime.split(':')[0])
                  const end = parseInt(s.endTime.split(':')[0])
                  return total + (end - start)
                }, 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{t('dashboard.student.hoursPerWeek')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
