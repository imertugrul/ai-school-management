'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
type ScheduleStatus = 'UPCOMING' | 'ACTIVE' | 'PAST'

interface StudentRow {
  id: string
  name: string
  status: AttStatus
  notes: string
}

interface ScheduleItem {
  id: string
  courseName: string
  courseCode: string
  classId: string | null
  className: string | null
  startTime: string
  endTime: string
  room: string | null
  students: { id: string; name: string }[]
  isLateEntry: boolean
  existingAttendance: { studentId: string; status: AttStatus; notes: string | null }[] | null
}

interface WeekScheduleItem {
  scheduleId: string
  courseName: string
  className: string | null
  startTime: string
  endTime: string
  totalStudents: number
  recorded: boolean
  presentCount: number
  absentCount: number
  lateCount: number
  todayStatus: ScheduleStatus | null
}

interface WeekDay {
  date: string
  dayOfWeek: number
  isToday: boolean
  isPast: boolean
  schedules: WeekScheduleItem[]
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  return `${DAY_NAMES[dow]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

function getMonday(d: Date): string {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon.toISOString().split('T')[0]
}

function computeStatus(startTime: string, endTime: string, now: Date): ScheduleStatus {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  if (nowMins < sh * 60 + sm) return 'UPCOMING'
  if (nowMins < eh * 60 + em) return 'ACTIVE'
  return 'PAST'
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Attendance Grid ───────────────────────────────────────────────────────
function AttendanceGrid({
  schedule,
  initialStudents,
  onSave,
  saving,
  readOnly,
}: {
  schedule: ScheduleItem
  initialStudents: StudentRow[]
  onSave: (scheduleId: string, data: StudentRow[]) => void
  saving: boolean
  readOnly: boolean
}) {
  const [rows, setRows] = useState<StudentRow[]>(initialStudents)

  const stats = {
    present: rows.filter(r => r.status === 'PRESENT').length,
    absent: rows.filter(r => r.status === 'ABSENT').length,
    late: rows.filter(r => r.status === 'LATE').length,
    excused: rows.filter(r => r.status === 'EXCUSED').length,
  }

  const setStatus = (id: string, status: AttStatus) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))

  const setNotes = (id: string, notes: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, notes } : r))

  const STATUS_CFG = {
    PRESENT: { label: '✓', title: 'Present', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'text-gray-400 border-gray-200 hover:border-emerald-400 hover:text-emerald-600' },
    ABSENT:  { label: '✗', title: 'Absent',  active: 'bg-red-600 text-white border-red-600',     inactive: 'text-gray-400 border-gray-200 hover:border-red-400 hover:text-red-600' },
    LATE:    { label: '⏰', title: 'Late',    active: 'bg-amber-500 text-white border-amber-500', inactive: 'text-gray-400 border-gray-200 hover:border-amber-400 hover:text-amber-600' },
    EXCUSED: { label: '📋', title: 'Excused', active: 'bg-blue-600 text-white border-blue-600',   inactive: 'text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-600' },
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {/* Bulk actions + live summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setRows(prev => prev.map(r => ({ ...r, status: 'PRESENT' })))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              ✓ All Present
            </button>
            <button
              onClick={() => setRows(prev => prev.map(r => ({ ...r, status: 'ABSENT' })))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
            >
              ✗ All Absent
            </button>
          </div>
        )}
        <div className="flex gap-4 text-xs font-bold ml-auto">
          <span className="text-emerald-600">{stats.present} Present</span>
          <span className="text-red-500">{stats.absent} Absent</span>
          <span className="text-amber-500">{stats.late} Late</span>
          {stats.excused > 0 && <span className="text-blue-500">{stats.excused} Excused</span>}
        </div>
      </div>

      {/* Student rows */}
      <div className="space-y-2 mb-4 max-h-[480px] overflow-y-auto pr-1">
        {rows.map(row => (
          <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{getInitials(row.name)}</span>
                </div>
                <span className="font-medium text-gray-900 text-sm truncate">{row.name}</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttStatus[]).map(opt => {
                  const cfg = STATUS_CFG[opt]
                  return (
                    <button
                      key={opt}
                      title={cfg.title}
                      disabled={readOnly}
                      onClick={() => setStatus(row.id, opt)}
                      className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${row.status === opt ? cfg.active : cfg.inactive} ${readOnly ? 'cursor-default' : ''}`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {!readOnly && (row.status === 'ABSENT' || row.status === 'LATE') && (
              <input
                type="text"
                placeholder="Add notes (optional)..."
                value={row.notes}
                onChange={e => setNotes(row.id, e.target.value)}
                className="mt-2 w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            )}
            {readOnly && row.notes && (
              <p className="text-xs text-gray-400 mt-1 ml-[42px] italic">{row.notes}</p>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={() => onSave(schedule.id, rows)}
          disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {saving ? 'Saving…' : `💾 Save Attendance — ${schedule.courseName}${schedule.className ? ` · ${schedule.className}` : ''}`}
        </button>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
function AttendancePage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentRow[]>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [weekData, setWeekData] = useState<WeekDay[] | null>(null)
  const [weekLoading, setWeekLoading] = useState(false)

  // For transition detection without stale closures
  const schedulesRef = useRef<ScheduleItem[]>([])
  const prevStatusesRef = useRef<Record<string, ScheduleStatus>>({})

  useEffect(() => { schedulesRef.current = schedules }, [schedules])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Live clock — every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      // Detect status transitions
      schedulesRef.current.forEach(s => {
        const newStatus = computeStatus(s.startTime, s.endTime, now)
        const prev = prevStatusesRef.current[s.id]
        if (prev && prev !== newStatus) {
          if (newStatus === 'ACTIVE') showToast(`${s.courseName} has started! 🟢`)
          else if (newStatus === 'PAST') showToast(`${s.courseName} class ended.`)
        }
        prevStatusesRef.current[s.id] = newStatus
      })
    }, 60_000)
    return () => clearInterval(timer)
  }, [showToast])

  const fetchSchedules = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/attendance/schedule?date=${date}`)
      const data = await res.json()
      if (!data.success) return
      const items: ScheduleItem[] = data.schedules
      setSchedules(items)

      // Init attendance map (all present by default, existing records override)
      const map: Record<string, StudentRow[]> = {}
      items.forEach(s => {
        map[s.id] = s.students.map(st => {
          const ex = s.existingAttendance?.find(e => e.studentId === st.id)
          return { id: st.id, name: st.name, status: (ex?.status ?? 'PRESENT') as AttStatus, notes: ex?.notes ?? '' }
        })
        // Init previous statuses for transition detection
        prevStatusesRef.current[s.id] = computeStatus(s.startTime, s.endTime, currentTime)
      })
      setAttendanceMap(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [currentTime])

  const fetchWeek = useCallback(async () => {
    setWeekLoading(true)
    try {
      const weekStart = getMonday(new Date())
      const res = await fetch(`/api/teacher/attendance/weekly?weekStart=${weekStart}`)
      const data = await res.json()
      if (data.success) setWeekData(data.days)
    } catch (e) {
      console.error(e)
    } finally {
      setWeekLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules(selectedDate) }, [selectedDate, fetchSchedules])

  useEffect(() => {
    if (activeTab === 'week' && !weekData) fetchWeek()
  }, [activeTab, weekData, fetchWeek])

  const handleSave = async (scheduleId: string, rows: StudentRow[]) => {
    const sched = schedules.find(s => s.id === scheduleId)
    if (!sched?.classId) return

    setSaving(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: sched.classId,
          date: selectedDate,
          attendance: rows.map(r => ({ studentId: r.id, status: r.status, notes: r.notes || null })),
        }),
      })
      const data = await res.json()
      if (data.success) {
        const absentLate = rows.filter(r => r.status === 'ABSENT' || r.status === 'LATE').length
        showToast(absentLate > 0
          ? `Attendance saved. ${absentLate} absence notification${absentLate > 1 ? 's' : ''} pending approval.`
          : 'Attendance saved successfully.')
        setExpandedId(null)
        setWeekData(null) // force weekly refresh on next tab visit
        fetchSchedules(selectedDate)
      } else {
        showToast('Error: ' + (data.error ?? 'Failed to save'))
      }
    } catch {
      showToast('Error saving attendance.')
    } finally {
      setSaving(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr
  const clockStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  // Compute live statuses from currentTime (never stale)
  const liveSchedules = schedules.map(s => ({
    ...s,
    liveStatus: computeStatus(s.startTime, s.endTime, currentTime),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-xs">
          {toast}
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                📋
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Attendance</h1>
                <p className="text-xs text-gray-400">Smart schedule-based tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isToday && (
                <span className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-mono font-semibold">
                  🕐 {clockStr}
                </span>
              )}
              <button
                onClick={() => router.push('/teacher/attendance/history')}
                className="text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                History
              </button>
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900">{formatDateLong(selectedDate)}</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {schedules.length > 0
              ? `${schedules.length} class${schedules.length > 1 ? 'es' : ''} scheduled`
              : 'No classes scheduled'}
          </p>
        </div>

        {/* Tabs + date picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
            {(['today', 'week'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'today' ? '📅 Today' : '📆 This Week'}
              </button>
            ))}
          </div>
          {activeTab === 'today' && (
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium text-gray-700"
            />
          )}
        </div>

        {/* ── TODAY TAB ─────────────────────────────────────────── */}
        {activeTab === 'today' && (
          loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}
            </div>
          ) : liveSchedules.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No classes scheduled for today</h3>
              <p className="text-gray-400 text-sm mb-5">
                {new Date(selectedDate + 'T12:00:00').getDay() === 0 || new Date(selectedDate + 'T12:00:00').getDay() === 6
                  ? "It's the weekend!"
                  : 'No classes assigned for this day.'}
              </p>
              <button onClick={() => setActiveTab('week')} className="text-sm font-semibold text-blue-600 hover:underline">
                View weekly schedule →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {liveSchedules.map(sched => {
                const { liveStatus: status, existingAttendance: existing } = sched
                const isExpanded = expandedId === sched.id
                const rows = attendanceMap[sched.id] ?? []
                const readOnly = status === 'PAST' && !!existing

                // Card styling per status
                const borderColor =
                  status === 'ACTIVE' ? 'border-l-emerald-500' :
                  status === 'PAST' && existing ? 'border-l-blue-400' :
                  status === 'PAST' ? 'border-l-amber-400' :
                  'border-l-gray-300'
                const bgColor =
                  status === 'ACTIVE' ? 'bg-emerald-50/40' :
                  status === 'PAST' && existing ? 'bg-white' :
                  status === 'PAST' ? 'bg-amber-50/30' :
                  'bg-white'

                // Status badge
                const badge =
                  status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      🟢 ACTIVE NOW
                    </span>
                  ) : status === 'UPCOMING' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      ⏰ UPCOMING — starts at {sched.startTime}
                    </span>
                  ) : existing ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                      ✓ COMPLETED — {sched.startTime}–{sched.endTime}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      ⚠️ NOT RECORDED — {sched.startTime}–{sched.endTime}
                    </span>
                  )

                const presentCount = existing?.filter(e => e.status === 'PRESENT').length ?? 0
                const absentCount = existing?.filter(e => e.status === 'ABSENT').length ?? 0
                const lateCount = existing?.filter(e => e.status === 'LATE').length ?? 0

                return (
                  <div
                    key={sched.id}
                    className={`rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-l-4 ${borderColor} ${bgColor} transition-all duration-200`}
                  >
                    <div className="p-5">
                      {/* Badge + late-entry flag */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {badge}
                        {sched.isLateEntry && status === 'PAST' && !existing && (
                          <span className="text-xs text-amber-500 font-medium">⚡ Late entry mode</span>
                        )}
                      </div>

                      {/* Course info + action button */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {sched.courseName}
                            {sched.className && (
                              <span className="font-normal text-gray-500"> — {sched.className}</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            🕐 {sched.startTime}–{sched.endTime}
                            {sched.room && <span> · 🚪 {sched.room}</span>}
                            <span> · 👥 {sched.students.length} students</span>
                          </p>
                        </div>

                        <div className="shrink-0">
                          {status === 'UPCOMING' ? (
                            <button
                              disabled
                              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                            >
                              Not started yet
                            </button>
                          ) : status === 'ACTIVE' ? (
                            <button
                              onClick={() => setExpandedId(prev => prev === sched.id ? null : sched.id)}
                              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-105 shadow-sm"
                            >
                              {isExpanded ? 'Close' : 'Take Attendance'}
                            </button>
                          ) : !existing ? (
                            <button
                              onClick={() => setExpandedId(prev => prev === sched.id ? null : sched.id)}
                              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all"
                            >
                              {isExpanded ? 'Close' : 'Record Late'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setExpandedId(prev => prev === sched.id ? null : sched.id)}
                              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              {isExpanded ? 'Close' : 'View Details'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PAST + recorded summary (collapsed) */}
                      {status === 'PAST' && existing && !isExpanded && (
                        <div className="flex gap-4 mt-3 text-sm font-semibold">
                          <span className="text-emerald-600">✅ {presentCount} Present</span>
                          <span className="text-red-500">❌ {absentCount} Absent</span>
                          <span className="text-amber-500">⏰ {lateCount} Late</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded attendance grid */}
                    {isExpanded && sched.classId && rows.length > 0 && (
                      <div className="px-5 pb-5">
                        <AttendanceGrid
                          schedule={sched}
                          initialStudents={rows}
                          onSave={handleSave}
                          saving={saving}
                          readOnly={readOnly}
                        />
                      </div>
                    )}

                    {isExpanded && !sched.classId && (
                      <div className="px-5 pb-5 text-sm text-gray-400 italic">
                        No class assigned to this schedule entry.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── WEEK TAB ──────────────────────────────────────────── */}
        {activeTab === 'week' && (
          weekLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />)}
            </div>
          ) : weekData ? (
            <div className="space-y-3">
              {weekData.map(day => (
                <div
                  key={day.date}
                  className={`rounded-2xl border overflow-hidden shadow-sm ${day.isToday ? 'border-blue-200' : 'border-gray-100'}`}
                >
                  {/* Day header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${day.isToday ? 'bg-blue-50 border-b border-blue-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {DAY_NAMES[day.dayOfWeek]}, {formatDateShort(day.date)}
                      </span>
                      {day.isToday && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">TODAY</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {day.schedules.length} class{day.schedules.length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* Schedule rows */}
                  {day.schedules.length === 0 ? (
                    <div className="px-5 py-3 bg-white text-xs text-gray-400 italic">No classes</div>
                  ) : (
                    <div className="bg-white divide-y divide-gray-50">
                      {day.schedules.map(s => {
                        let icon = '📚'
                        let statusLabel = ''
                        let labelColor = 'text-gray-400'

                        if (day.isToday && s.todayStatus === 'ACTIVE') {
                          icon = '🟢'; statusLabel = 'ACTIVE NOW'; labelColor = 'text-emerald-600 font-bold'
                        } else if (day.isToday && s.todayStatus === 'UPCOMING') {
                          icon = '⏰'; statusLabel = 'Upcoming'; labelColor = 'text-gray-400'
                        } else if (s.recorded) {
                          icon = '✅'; statusLabel = `${s.presentCount}/${s.totalStudents} present`; labelColor = 'text-emerald-600'
                        } else if (day.isPast || (day.isToday && s.todayStatus === 'PAST')) {
                          icon = '⚠️'; statusLabel = 'Not recorded'; labelColor = 'text-amber-500'
                        }

                        const canRecordLate = (day.isPast || (day.isToday && s.todayStatus === 'PAST')) && !s.recorded

                        return (
                          <div key={s.scheduleId} className="px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-base shrink-0">{icon}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {s.courseName}
                                  {s.className && <span className="font-normal text-gray-400"> — {s.className}</span>}
                                </p>
                                <p className="text-xs text-gray-400">{s.startTime}–{s.endTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs ${labelColor}`}>{statusLabel}</span>
                              {canRecordLate && (
                                <button
                                  onClick={() => { setSelectedDate(day.date); setActiveTab('today') }}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors"
                                >
                                  Record Late
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

export default function AttendancePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    }>
      <AttendancePage />
    </Suspense>
  )
}
