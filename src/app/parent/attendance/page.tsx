'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  notes: string | null
  class: { name: string }
}

interface AttendanceData {
  records: AttendanceRecord[]
  stats: { total: number; present: number; absent: number; late: number; excused: number; rate: number }
}

interface Child { id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-100 text-red-700 border-red-200',
  LATE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  EXCUSED: 'bg-blue-100 text-blue-700 border-blue-200',
}

function ParentAttendanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState(searchParams.get('studentId') || '')
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setChildren(res.children)
          if (!selectedChildId && res.children.length > 0) setSelectedChildId(res.children[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedChildId) return
    setLoading(true)
    fetch(`/api/parent/child/${selectedChildId}/attendance`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res) })
      .finally(() => setLoading(false))
  }, [selectedChildId])

  const stats = data?.stats

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Attendance</h1>
                <p className="text-xs text-gray-500">View your child's attendance</p>
              </div>
            </div>
            <button onClick={() => router.push('/parent/dashboard')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {children.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Child</label>
            <select className="input-field max-w-xs" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          </div>
        ) : !data ? null : (
          <>
            {/* Stats */}
            {stats && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                  <span className={`text-2xl font-bold ${stats.rate >= 90 ? 'text-emerald-600' : stats.rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {stats.rate}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all ${stats.rate >= 90 ? 'bg-emerald-500' : stats.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.rate}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Present', value: stats.present, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Absent', value: stats.absent, color: 'text-red-600 bg-red-50' },
                    { label: 'Late', value: stats.late, color: 'text-yellow-600 bg-yellow-50' },
                    { label: 'Excused', value: stats.excused, color: 'text-blue-600 bg-blue-50' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs font-medium opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Records */}
            {data.records.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendance records</h3>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
                <div className="divide-y divide-gray-50">
                  {data.records.map(record => (
                    <div key={record.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500">{record.class?.name}</p>
                        {record.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{record.notes}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[record.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ParentAttendancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" /></div>}>
      <ParentAttendanceContent />
    </Suspense>
  )
}
