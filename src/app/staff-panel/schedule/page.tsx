'use client'

import { useEffect, useState } from 'react'

interface ScheduleEntry {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string | null
  teacher: { id: string; name: string }
  class: { id: string; name: string } | null
  room: string | null
}

const DAY_NAMES = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function StaffSchedulePage() {
  const [entries, setEntries]         = useState<ScheduleEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [classes, setClasses]         = useState<{ id: string; name: string }[]>([])
  const [teachers, setTeachers]       = useState<{ id: string; name: string }[]>([])
  const [classFilter, setClassFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')

  useEffect(() => {
    fetch('/api/staff/schedule')
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries ?? [])
        setClasses(d.classes ?? [])
        setTeachers(d.teachers ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = entries.filter(e => {
    const matchClass   = !classFilter   || e.class?.id === classFilter
    const matchTeacher = !teacherFilter || e.teacher.id === teacherFilter
    return matchClass && matchTeacher
  })

  // Group by day
  const byDay: Record<number, ScheduleEntry[]> = {}
  filtered.forEach(e => {
    if (!byDay[e.dayOfWeek]) byDay[e.dayOfWeek] = []
    byDay[e.dayOfWeek].push(e)
  })
  // Sort each day's entries by startTime
  Object.values(byDay).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Haftalık Program</h1>
        <p className="text-sm text-gray-500 mt-1">Salt okunur okul programı</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sınıf</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Sınıflar</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Öğretmen</label>
          <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Öğretmenler</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button onClick={() => { setClassFilter(''); setTeacherFilter('') }} className="btn-secondary text-sm">Sıfırla</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🗓️</div>
          <p className="text-gray-500">Program bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(day => {
            const dayEntries = byDay[day] ?? []
            if (dayEntries.length === 0 && (classFilter || teacherFilter)) return null
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3">
                  <h2 className="font-semibold text-indigo-800">{DAY_NAMES[day]}</h2>
                </div>
                {dayEntries.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400">Bu gün için program yok</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 text-xs font-semibold text-gray-500">
                        <th className="text-left px-5 py-2">Saat</th>
                        <th className="text-left px-5 py-2">Ders</th>
                        <th className="text-left px-5 py-2">Öğretmen</th>
                        <th className="text-left px-5 py-2">Sınıf</th>
                        <th className="text-left px-5 py-2">Oda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayEntries.map((e, i) => (
                        <tr key={e.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                          <td className="px-5 py-2.5 text-gray-500 font-mono text-xs">{e.startTime}–{e.endTime}</td>
                          <td className="px-5 py-2.5 font-medium text-gray-900">{e.subject ?? '—'}</td>
                          <td className="px-5 py-2.5 text-gray-600">{e.teacher.name}</td>
                          <td className="px-5 py-2.5 text-gray-500">{e.class?.name ?? '—'}</td>
                          <td className="px-5 py-2.5 text-gray-400">{e.room ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
