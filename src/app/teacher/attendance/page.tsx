'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Class {
  id: string
  name: string
}

interface Student {
  studentId: string
  studentName: string
  studentEmail: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null
  notes: string | null
  notificationStatus: string | null
}

function AttendanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('classId') || '')
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('date') || new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendance()
    }
  }, [selectedClass, selectedDate])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes')
      const data = await response.json()

      if (data.success) {
        setClasses(data.classes)
        if (data.classes.length > 0 && !searchParams.get('classId')) {
          setSelectedClass(data.classes[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/attendance?classId=${selectedClass}&date=${selectedDate}`)
      const data = await response.json()

      if (data.success) {
        setAttendance(data.attendance)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendance(prev => prev.map(student =>
      student.studentId === studentId
        ? { ...student, status }
        : student
    ))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendance(prev => prev.map(student =>
      student.studentId === studentId
        ? { ...student, notes }
        : student
    ))
  }

  const handleMarkAllPresent = () => {
    setAttendance(prev => prev.map(student => ({
      ...student,
      status: 'PRESENT' as const
    })))
  }

  const handleSave = async () => {
    console.log('Selected Class:', selectedClass)
    console.log('Selected Date:', selectedDate)
    console.log('Attendance Data:', attendance)

    setSaving(true)
    try {
      const attendanceData = attendance
        .filter(student => student.status !== null)
        .map(student => ({
          studentId: student.studentId,
          status: student.status,
          notes: student.notes || null
        }))

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          attendance: attendanceData
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchAttendance()
      } else {
        alert('Error: ' + (data.error || 'Failed to save attendance'))
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance')
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    present: attendance.filter(s => s.status === 'PRESENT').length,
    absent: attendance.filter(s => s.status === 'ABSENT').length,
    late: attendance.filter(s => s.status === 'LATE').length,
    excused: attendance.filter(s => s.status === 'EXCUSED').length,
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const notifIcon = (s: string | null) => {
    if (!s) return null
    const map: Record<string, { icon: string; title: string; cls: string }> = {
      PENDING:   { icon: '⏳', title: 'Onay bekliyor',    cls: 'text-amber-500' },
      APPROVED:  { icon: '✅', title: 'Onaylandı',         cls: 'text-blue-500'  },
      CORRECTED: { icon: '✏️', title: 'Düzeltildi',        cls: 'text-purple-500' },
      SENT:      { icon: '📨', title: 'Bildirim gönderildi', cls: 'text-green-500' },
      FAILED:    { icon: '❌', title: 'Gönderim başarısız', cls: 'text-red-500'   },
    }
    const m = map[s]
    if (!m) return null
    return <span title={m.title} className={`text-base ${m.cls}`}>{m.icon}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Take Attendance</h1>
                <p className="text-xs text-gray-500">Mark daily attendance and notify parents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/teacher/attendance/history')}
                className="btn-primary text-sm"
              >
                View History
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleMarkAllPresent}
                className="btn-secondary w-full"
              >
                ✓ Mark All Present
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading students...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students in this class</h3>
            <p className="text-gray-500 text-sm">Students need to be assigned to this class first</p>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">
                  Students ({attendance.length})
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Present', value: stats.present, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { label: 'Absent', value: stats.absent, color: 'bg-red-50 text-red-700 border-red-200' },
                  { label: 'Late', value: stats.late, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Excused', value: stats.excused, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                ].map(s => (
                  <div key={s.label} className={`text-center py-2 px-3 rounded-xl border ${s.color}`}>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {attendance.map((student) => (
                <div key={student.studentId} className="card py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{getInitials(student.studentName)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{student.studentName}</h3>
                          {notifIcon(student.notificationStatus)}
                        </div>
                        <p className="text-xs text-gray-400">{student.studentEmail}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((statusOpt) => {
                        const statusStyles: Record<string, string> = {
                          PRESENT: student.status === 'PRESENT' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600',
                          ABSENT: student.status === 'ABSENT' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600',
                          LATE: student.status === 'LATE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600',
                          EXCUSED: student.status === 'EXCUSED' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600',
                        }
                        const labels: Record<string, string> = {
                          PRESENT: '✓ Present',
                          ABSENT: '✗ Absent',
                          LATE: '⏰ Late',
                          EXCUSED: '📝 Excused',
                        }
                        return (
                          <button
                            key={statusOpt}
                            onClick={() => handleStatusChange(student.studentId, statusOpt)}
                            className={`px-3 py-1.5 rounded-xl border font-medium text-sm transition-all ${statusStyles[statusOpt]}`}
                          >
                            {labels[statusOpt]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {(student.status === 'ABSENT' || student.status === 'LATE') && (
                    <div className="mt-3 ml-13">
                      <input
                        type="text"
                        placeholder="Add notes (optional)..."
                        value={student.notes || ''}
                        onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-base px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor…' : '💾 Yoklamayı Kaydet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  )
}
