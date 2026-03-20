'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string
  endDate: string
  isAllDay: boolean
  category: string
  color: string | null
  organizer: { id: string; name: string }
  rsvps: { status: string }[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Academic: '#3b82f6',
  Sports: '#10b981',
  Cultural: '#8b5cf6',
  Holiday: '#f59e0b',
  General: '#6b7280'
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function EventsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)

  const role = (session?.user as { role?: string })?.role
  const backPath =
    role === 'ADMIN' ? '/admin' :
    role === 'TEACHER' ? '/teacher/dashboard' :
    role === 'PARENT' ? '/parent/dashboard' :
    '/student/dashboard'

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthParam = `${year}-${String(month + 1).padStart(2, '0')}`

  const fetchEvents = () => {
    setLoading(true)
    fetch(`/api/events?month=${monthParam}`)
      .then(r => r.json())
      .then(data => { if (data.success) setEvents(data.events) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEvents() }, [monthParam])

  const handleRSVP = async (eventId: string, status: string) => {
    setRsvpLoading(eventId)
    try {
      await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchEvents()
    } catch (error) {
      console.error('RSVP error:', error)
    } finally {
      setRsvpLoading(null)
    }
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      const d = new Date(e.startDate)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(backPath)} className="btn-secondary text-sm">
                ← Back
              </button>
              <h1 className="text-lg font-bold text-gray-900">Events Calendar</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Legend */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-gray-600">{cat}</span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <button onClick={prevMonth} className="btn-secondary text-sm px-3 py-1.5">
                  ←
                </button>
                <h2 className="text-lg font-bold text-gray-900">
                  {MONTH_NAMES[month]} {year}
                </h2>
                <button onClick={nextMonth} className="btn-secondary text-sm px-3 py-1.5">
                  →
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAY_NAMES.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {/* Empty cells for first day */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-50" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dayEvents = getEventsForDay(day)
                    const isSelected = selectedDay === day
                    const isToday = new Date().getDate() === day &&
                      new Date().getMonth() === month &&
                      new Date().getFullYear() === year

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`h-24 border-b border-r border-gray-50 p-1 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className="text-xs px-1 py-0.5 rounded text-white truncate"
                              style={{ backgroundColor: event.color || CATEGORY_COLORS[event.category] || CATEGORY_COLORS.General }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-400">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div>
            {selectedDay ? (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  {MONTH_NAMES[month]} {selectedDay}, {year}
                </h3>
                {selectedEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-sm">No events this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map(event => {
                      const myRsvp = event.rsvps[0]?.status
                      return (
                        <div key={event.id} className="card bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div
                            className="w-full h-1.5 rounded-full mb-3"
                            style={{ backgroundColor: event.color || CATEGORY_COLORS[event.category] || CATEGORY_COLORS.General }}
                          />
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-xs text-gray-500 mb-2">{event.description}</p>
                          )}
                          {event.location && (
                            <p className="text-xs text-gray-400 mb-2">📍 {event.location}</p>
                          )}
                          <p className="text-xs text-gray-400 mb-3">
                            {event.isAllDay ? 'All day' : (
                              `${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            )}
                          </p>
                          <div className="flex gap-1">
                            {['GOING', 'MAYBE', 'NOT_GOING'].map(status => (
                              <button
                                key={status}
                                disabled={rsvpLoading === event.id}
                                onClick={() => handleRSVP(event.id, status)}
                                className={`flex-1 text-xs py-1 px-2 rounded-lg font-medium transition-colors ${
                                  myRsvp === status
                                    ? status === 'GOING' ? 'bg-green-500 text-white'
                                    : status === 'MAYBE' ? 'bg-yellow-500 text-white'
                                    : 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {status === 'GOING' ? '✓' : status === 'MAYBE' ? '?' : '✗'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm">Click a day to see events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
