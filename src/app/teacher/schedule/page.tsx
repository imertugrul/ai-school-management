'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScheduleEntry {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  course: { id: string; code: string; name: string }
  class: { id: string; name: string } | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const COURSE_COLORS = [
  'border-blue-400 bg-blue-50',
  'border-purple-400 bg-purple-50',
  'border-emerald-400 bg-emerald-50',
  'border-orange-400 bg-orange-50',
  'border-indigo-400 bg-indigo-50',
  'border-rose-400 bg-rose-50',
  'border-teal-400 bg-teal-50',
]

export default function TeacherSchedulePage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalClasses: 0, uniqueCourses: 0, teachingHours: 0 })

  useEffect(() => { fetchSchedule() }, [])

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/teacher/schedule')
      const data = await res.json()
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

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this schedule entry?')) return
    await fetch(`/api/teacher/schedule?id=${id}`, { method: 'DELETE' })
    fetchSchedule()
  }

  const getDaySchedule = (day: number) =>
    schedules.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Build a color map for courses (consistent colors per course)
  const courseColorMap: Record<string, string> = {}
  const uniqueCourseIds = [...new Set(schedules.map(s => s.course.id))]
  uniqueCourseIds.forEach((id, i) => {
    courseColorMap[id] = COURSE_COLORS[i % COURSE_COLORS.length]
  })

  const today = new Date().getDay()
  const todayIndex = today === 0 || today === 6 ? -1 : today - 1

  const statCards = [
    { icon: '📚', label: 'Total Classes/Week', value: stats.totalClasses },
    { icon: '🎓', label: 'Unique Courses', value: stats.uniqueCourses },
    { icon: '⏰', label: 'Teaching Hours/Week', value: stats.teachingHours },
  ]

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📅</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Schedule</h1>
                <p className="text-xs text-gray-500">Weekly teaching schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/teacher/schedule/upload')} className="btn-primary text-sm">
                AI Upload
              </button>
              <button onClick={() => router.push('/teacher/schedule/add')} className="btn-secondary text-sm">
                + Add Entry
              </button>
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors shrink-0">
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Grid */}
        {schedules.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedule entries yet</h3>
            <p className="text-gray-500 text-sm mb-6">Add your first class to get started</p>
            <button onClick={() => router.push('/teacher/schedule/add')} className="btn-primary">
              + Add First Entry
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            {DAYS.map((day, i) => {
              const entries = getDaySchedule(i)
              const isToday = i === todayIndex
              return (
                <div key={day} className={`rounded-2xl border-2 p-4 transition-all ${isToday ? 'border-blue-400 bg-blue-50/50 shadow-md shadow-blue-100' : 'border-gray-200 bg-white'}`}>
                  <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${isToday ? 'border-blue-300' : 'border-gray-100'}`}>
                    <h3 className={`font-bold text-sm ${isToday ? 'text-blue-800' : 'text-gray-700'}`}>
                      {day}
                    </h3>
                    {isToday && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                        Today
                      </span>
                    )}
                  </div>

                  {entries.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-4">No classes</p>
                  ) : (
                    <div className="space-y-3">
                      {entries.map(entry => (
                        <div key={entry.id} className={`border-l-4 rounded-xl p-3 shadow-sm bg-white ${courseColorMap[entry.course.id] || 'border-gray-300 bg-gray-50'}`}>
                          <div className="text-xs font-semibold text-blue-600 mb-1">
                            {entry.startTime} – {entry.endTime}
                          </div>
                          <div className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                            {entry.course.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">{entry.course.code}</span>
                            {entry.class && <span> · {entry.class.name}</span>}
                            {entry.room && <span> · Room {entry.room}</span>}
                          </div>

                          <div className="flex gap-1 mt-2">
                            {entry.class && (
                              <button
                                onClick={() => router.push(
                                  `/teacher/attendance?classId=${entry.class!.id}&date=${new Date().toISOString().split('T')[0]}`
                                )}
                                className="flex-1 text-xs py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                              >
                                Attendance
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-xs px-2 py-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors"
                            >
                              ✕
                            </button>
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
  )
}
