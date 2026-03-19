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
        alert('Attendance marked successfully! Parents notified.')
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Take Attendance</h1>
            <p className="text-gray-600 mt-1">Mark daily attendance and notify parents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/teacher/attendance/history')}
              className="btn-primary"
            >
              📊 View History
            </button>
            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="btn-secondary"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No students in this class</p>
          </div>
        ) : (
          <>
            <div className="card mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Students ({attendance.length})
              </h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Present: {stats.present}</span>
                <span className="text-red-600">Absent: {stats.absent}</span>
                <span className="text-yellow-600">Late: {stats.late}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {attendance.map((student) => (
                <div key={student.studentId} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.studentName}</h3>
                      <p className="text-sm text-gray-500">{student.studentEmail}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.status === 'PRESENT'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ✓ Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.status === 'ABSENT'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ✗ Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'LATE')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.status === 'LATE'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ⏰ Late
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          student.status === 'EXCUSED'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        📝 Excused
                      </button>
                    </div>
                  </div>

                  {(student.status === 'ABSENT' || student.status === 'LATE') && (
                    <div>
                      <input
                        type="text"
                        placeholder="Add notes (optional)..."
                        value={student.notes || ''}
                        onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                        className="input-field"
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
                className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '💾 Saving...' : '💾 Save Attendance & Notify Parents'}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  )
}