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

  const today = new Date().getDay() // 0=Sun, 1=Mon...
  const todayIndex = today === 0 || today === 6 ? -1 : today - 1 // 0=Mon...4=Fri

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Schedule</h1>
            <div className="flex gap-2">
              <button onClick={() => router.push('/teacher/schedule/add')} className="btn-primary text-sm">
                + Add Entry
              </button>
              <button onClick={() => router.push('/teacher/dashboard')} className="btn-secondary text-sm">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '📚', label: 'Total Classes/Week', value: stats.totalClasses },
            { icon: '🎓', label: 'Unique Courses',     value: stats.uniqueCourses },
            { icon: '⏰', label: 'Teaching Hours/Week', value: stats.teachingHours },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-4">
              <div className="text-4xl">{s.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Grid */}
        {schedules.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 mb-2">No schedule entries yet.</p>
            <p className="text-gray-400 text-sm mb-6">Add your first class to get started.</p>
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
                <div key={day} className={`rounded-xl border-2 ${isToday ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white'} p-4`}>
                  <h3 className={`font-bold text-center mb-3 ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                    {day}
                    {isToday && <span className="ml-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                  </h3>

                  {entries.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">No classes</p>
                  ) : (
                    <div className="space-y-3">
                      {entries.map(entry => (
                        <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="text-xs font-semibold text-primary-600 mb-1">
                            {entry.startTime} – {entry.endTime}
                          </div>
                          <div className="font-semibold text-gray-900 text-sm leading-tight">
                            {entry.course.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.course.code}
                            {entry.class && ` · ${entry.class.name}`}
                            {entry.room && ` · Room ${entry.room}`}
                          </div>

                          <div className="flex gap-1 mt-2">
                            {entry.class && (
                              <button
                                onClick={() => router.push(
                                  `/teacher/attendance?classId=${entry.class!.id}&date=${new Date().toISOString().split('T')[0]}`
                                )}
                                className="flex-1 text-xs py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Attendance
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-red-100 hover:text-red-600"
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
