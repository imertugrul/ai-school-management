'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes: string | null
  class: { name: string }
}

interface Stats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  rate: number
}

const STATUS_STYLE: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT:  'bg-red-100 text-red-800',
  LATE:    'bg-yellow-100 text-yellow-800',
  EXCUSED: 'bg-blue-100 text-blue-800',
}

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT:  'Absent',
  LATE:    'Late',
  EXCUSED: 'Excused',
}

export default function StudentAttendancePage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/attendance')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRecords(data.records)
          setStats(data.stats)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Attendance</h1>
            <button onClick={() => router.push('/student/dashboard')} className="btn-secondary">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Attendance Rate', value: `${stats.rate}%`, color: stats.rate >= 90 ? 'text-green-600' : stats.rate >= 75 ? 'text-yellow-600' : 'text-red-600' },
              { label: 'Present', value: stats.present, color: 'text-green-600' },
              { label: 'Absent',  value: stats.absent,  color: 'text-red-600' },
              { label: 'Late',    value: stats.late,    color: 'text-yellow-600' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Attendance rate bar */}
        {stats && (
          <div className="card">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Overall Attendance Rate</span>
              <span className="font-bold">{stats.rate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${stats.rate >= 90 ? 'bg-green-500' : stats.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            {stats.rate < 90 && (
              <p className="text-xs text-gray-400 mt-2">
                {stats.rate >= 75 ? 'Attendance below recommended 90%.' : 'Low attendance — please contact your school.'}
              </p>
            )}
          </div>
        )}

        {/* Records */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Attendance Records
            <span className="ml-2 text-sm font-normal text-gray-400">({records.length})</span>
          </h2>

          {records.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No attendance records yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map(r => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">{r.class.name}{r.notes ? ` · ${r.notes}` : ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
