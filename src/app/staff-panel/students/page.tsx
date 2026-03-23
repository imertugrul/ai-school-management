'use client'

import { useEffect, useState } from 'react'

interface Guardian {
  id: string
  name: string
  relationship: string
  email: string | null
  phone: string | null
  isPrimary: boolean
}

interface Student {
  id: string
  name: string
  email: string
  className: string | null
  classId: string | null
  guardians: Guardian[]
  absenceCount: number
}

interface AbsenceRecord {
  id: string
  date: string
  status: string
  notes: string | null
  class: { name: string }
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ABSENT:  { label: 'Devamsız',   cls: 'bg-red-100 text-red-700'    },
  LATE:    { label: 'Geç',        cls: 'bg-amber-100 text-amber-700' },
  EXCUSED: { label: 'Mazeretli', cls: 'bg-blue-100 text-blue-700'   },
  PRESENT: { label: 'Mevcut',    cls: 'bg-green-100 text-green-700' },
}

export default function StaffStudentsPage() {
  const [students, setStudents]     = useState<Student[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [selected, setSelected]     = useState<Student | null>(null)
  const [absences, setAbsences]     = useState<AbsenceRecord[]>([])
  const [absLoading, setAbsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/staff/students')
      .then(r => r.json())
      .then(d => setStudents(d.students ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function openStudent(s: Student) {
    setSelected(s)
    setAbsLoading(true)
    try {
      const r = await fetch(`/api/staff/students/${s.id}/attendance`)
      const d = await r.json()
      setAbsences(d.records ?? [])
    } finally {
      setAbsLoading(false)
    }
  }

  const classes = Array.from(new Set(students.map(s => s.className).filter(Boolean))) as string[]
  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchClass  = !classFilter || s.className === classFilter
    return matchSearch && matchClass
  })

  // Group by class
  const grouped: Record<string, Student[]> = {}
  filtered.forEach(s => {
    const key = s.className ?? 'Sınıfsız'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
        <p className="text-sm text-gray-500 mt-1">Salt okunur görünüm — düzenleme için admin panelini kullanın</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text" placeholder="Öğrenci ara…" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field text-sm flex-1 min-w-48"
        />
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field text-sm">
          <option value="">Tüm Sınıflar</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center text-sm text-gray-500">
          Toplam: <span className="ml-1 font-semibold text-gray-900">{filtered.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cls, list]) => (
            <div key={cls} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">{cls}</h2>
                <span className="text-xs text-gray-400">{list.length} öğrenci</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {list.map((s, i) => (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                      onClick={() => openStudent(s)}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {s.guardians.length === 0 ? (
                          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">⚠️ Veli yok</span>
                        ) : (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">✓ {s.guardians.length} veli</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-400">
                        {s.absenceCount > 0 && <span className="text-red-600 font-medium">{s.absenceCount} devamsız</span>}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-indigo-500">Detay →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Student detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-500">{selected.className ?? 'Sınıfsız'} · {selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Guardians */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Veli Bilgileri</h3>
                {selected.guardians.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3">⚠️ Bu öğrencinin veli kaydı yok</p>
                ) : (
                  <div className="space-y-2">
                    {selected.guardians.map(g => (
                      <div key={g.id} className={`border rounded-xl p-3 text-sm ${g.isPrimary ? 'border-teal-300 bg-teal-50' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{g.name}</span>
                          <span className="text-xs text-gray-400">{g.relationship}</span>
                        </div>
                        {g.email && <div className="text-xs text-gray-500 mt-0.5">📧 {g.email}</div>}
                        {g.phone && <div className="text-xs text-gray-500 mt-0.5">📱 {g.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance history */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Devamsızlık Geçmişi</h3>
                {absLoading ? (
                  <p className="text-sm text-gray-400">Yükleniyor…</p>
                ) : absences.length === 0 ? (
                  <p className="text-sm text-green-600 bg-green-50 rounded-xl p-3">✓ Devamsızlık kaydı yok</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {absences.slice(0, 20).map((a, i) => {
                      const sm = STATUS_LABEL[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-600' }
                      return (
                        <div key={a.id} className={`flex items-center justify-between px-3 py-2 text-sm ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                          <span className="text-gray-600">{new Date(a.date).toLocaleDateString('tr-TR')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sm.cls}`}>{sm.label}</span>
                          <span className="text-xs text-gray-400">{a.class.name}</span>
                        </div>
                      )
                    })}
                    {absences.length > 20 && <div className="text-center text-xs text-gray-400 py-2">+{absences.length - 20} daha</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
