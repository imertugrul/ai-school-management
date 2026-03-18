'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  class: {
    name: string
  } | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function TeacherSchedulePage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    uniqueCourses: 0,
    teachingHours: 0
  })

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/teacher/schedule')
      const data = await response.json()
      
      if (data.success) {
        setSchedules(data.schedules)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScheduleForDay = (dayIndex: number) => {
    return schedules
      .filter(s => s.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Schedule</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/teacher/schedule/add')}
                className="btn-primary text-sm"
              >
                ➕ Add Entry
              </button>
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="btn-secondary text-sm"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="text-4xl mr-4">📚</div>
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="text-4xl mr-4">🎓</div>
              <div>
                <p className="text-sm text-gray-600">Unique Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueCourses}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="text-4xl mr-4">⏰</div>
              <div>
                <p className="text-sm text-gray-600">Teaching Hours/Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.teachingHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Schedule</h2>
          
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 mb-4">No schedule entries yet</p>
              <button
                onClick={() => router.push('/teacher/schedule/add')}
                className="btn-primary"
              >
                ➕ Add First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day, index) => {
                const daySchedule = getScheduleForDay(index)
                
                return (
                  <div key={day} className="border-b border-gray-200 pb-6 last:border-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {day}
                    </h3>
                    
                    {daySchedule.length === 0 ? (
                      <p className="text-gray-500 text-sm">No classes scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {daySchedule.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                  {schedule.room && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Room {schedule.room}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                  {schedule.course.code} - {schedule.course.name}
                                </p>
                                {schedule.class && (
                                  <p className="text-sm text-gray-600">
                                    Class: {schedule.class.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}