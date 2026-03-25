'use client'

import { useEffect, useState } from 'react'
import { useChild } from '@/context/ChildContext'

interface AttendanceRecord {
  id: string; date: string; status: string; notes: string | null
  notification: { status: string; whatsappSent: boolean; emailSent: boolean } | null
}
interface Summary { present: number; absent: number; late: number; excused: number }

const STATUS_COLOR: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700', ABSENT: 'bg-red-100 text-red-700',
  LATE: 'bg-amber-100 text-amber-700', EXCUSED: 'bg-blue-100 text-blue-700',
}
const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused',
}
const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-green-400', ABSENT: 'bg-red-500', LATE: 'bg-amber-400', EXCUSED: 'bg-blue-400',
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}
function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ParentAttendance() {
  const { selectedChild, loading: childLoading } = useChild()
  const [month, setMonth]     = useState(currentMonth())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<Summary>({ present: 0, absent: 0, late: 0, excused: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true)
    fetch(`/api/parent/children/${selectedChild.id}/attendance?month=${month}`)
      .then(r => r.json())
      .then(d => { setRecords(d.records ?? []); setSummary(d.summary ?? { present: 0, absent: 0, late: 0, excused: 0 }) })
      .catch(console.error).finally(() => setLoading(false))
  }, [selectedChild?.id, month])

  const [year, monthNum] = month.split('-').map(Number)
  const daysInMonth      = new Date(year, monthNum, 0).getDate()
  const firstDayOfWeek   = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7
  const recordsByDay: Record<number, AttendanceRecord> = {}
  for (const r of records) recordsByDay[new Date(r.date).getDate()] = r

  const total      = summary.present + summary.absent + summary.late
  const attendRate = total > 0 ? Math.round((summary.present / total) * 100) : 100
  const nonPresent = records.filter(r => r.status !== 'PRESENT')

  if (childLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-400">{selectedChild?.name}</p>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 text-lg">‹</button>
        <span className="font-semibold text-gray-900 text-sm">{monthLabel(month)}</span>
        <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= currentMonth()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 text-lg disabled:opacity-30">›</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Present', value: summary.present, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absent', value: summary.absent, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Late', value: summary.late, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Excused', value: summary.excused, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-3 text-center`}>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Rate bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
          <span className={`text-lg font-bold ${attendRate >= 90 ? 'text-green-600' : attendRate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>%{attendRate}</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${attendRate >= 90 ? 'bg-green-500' : attendRate >= 80 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${attendRate}%` }} />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-7 mb-2">
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
        </div>
        {loading ? (
          <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const rec = recordsByDay[day]
              const isWeekend = ((firstDayOfWeek + i) % 7) >= 5
              return (
                <div key={day} className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium ${rec ? STATUS_COLOR[rec.status] : isWeekend ? 'text-gray-300' : 'text-gray-400'}`}>
                  {day}
                </div>
              )
            })}
          </div>
        )}
        <div className="flex gap-3 mt-3 flex-wrap">
          {[['PRESENT','Present'],['ABSENT','Absent'],['LATE','Late'],['EXCUSED','Excused']].map(([s,l]) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
              <span className="text-xs text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail list */}
      {nonPresent.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50"><h3 className="font-semibold text-gray-900 text-sm">Absence Detail</h3></div>
          {nonPresent.map(r => (
            <div key={r.id} className="px-4 py-3 flex items-start gap-3 border-b border-gray-50 last:border-0">
              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[r.status]}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  <span className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}</span>
                </div>
                {r.notes && <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>}
                {r.notification && (
                  <p className="text-xs mt-0.5">
                    {r.notification.whatsappSent || r.notification.emailSent
                      ? <span className="text-green-600">✓ Parent notified</span>
                      : r.notification.status === 'PENDING'
                        ? <span className="text-amber-600">⏳ Pending approval</span>
                        : <span className="text-gray-400">Not yet notified</span>
                    }
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="text-center py-10"><div className="text-4xl mb-2">📅</div><p className="text-sm text-gray-400">No attendance records for this month.</p></div>
      )}
    </div>
  )
}
