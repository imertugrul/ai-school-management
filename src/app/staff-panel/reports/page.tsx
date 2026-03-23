'use client'

import { useEffect, useState } from 'react'

interface StudentStat {
  id: string
  name: string
  className: string
  absent: number
  late: number
  excused: number
  total: number
  pct: number
}

interface ReportData {
  totalAbsent: number
  totalLate: number
  topClass: string
  topStudents: StudentStat[]
  studentStats: StudentStat[]
  dailyTrend: { date: string; absent: number; late: number }[]
}

export default function StaffReportsPage() {
  const [data, setData]           = useState<ReportData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [dateFrom, setDateFrom]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo]       = useState(new Date().toISOString().split('T')[0])
  const [classFilter, setClassFilter] = useState('')
  const [classes, setClasses]     = useState<string[]>([])

  useEffect(() => {
    fetch('/api/staff/students').then(r => r.json()).then(d => {
      const cls = Array.from(new Set((d.students ?? []).map((s: any) => s.className).filter(Boolean))) as string[]
      setClasses(cls)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from: dateFrom, to: dateTo })
    if (classFilter) params.set('classId', classFilter)
    fetch(`/api/staff/attendance-report?${params}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo, classFilter])

  function exportCSV() {
    if (!data?.studentStats.length) return
    const headers = ['Ad', 'Sınıf', 'Devamsız', 'Geç', 'Mazeretli', 'Toplam', 'Devam Oranı (%)']
    const rows = data.studentStats.map(s => [
      s.name, s.className, s.absent, s.late, s.excused, s.total, s.pct.toFixed(1),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `devamsizlik_${dateFrom}_${dateTo}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devamsızlık Raporları</h1>
          <p className="text-sm text-gray-500 mt-1">Tarih aralığı ve sınıf bazlı devamsızlık analizi</p>
        </div>
        <button onClick={exportCSV} disabled={!data?.studentStats.length}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-40">
          📥 CSV İndir
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sınıf</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Sınıflar</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : !data ? (
        <div className="text-center py-20 text-gray-400">Veri yüklenemedi.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{data.totalAbsent}</div>
              <div className="text-xs text-gray-500 mt-1">Toplam Devamsızlık</div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{data.totalLate}</div>
              <div className="text-xs text-gray-500 mt-1">Toplam Geç Kalma</div>
            </div>
            <div className="bg-white rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 truncate">{data.topClass || '—'}</div>
              <div className="text-xs text-gray-500 mt-1">En Çok Devamsız Sınıf</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <div className="text-3xl font-bold text-gray-700">{data.studentStats.length}</div>
              <div className="text-xs text-gray-500 mt-1">Toplam Öğrenci</div>
            </div>
          </div>

          {/* Daily trend */}
          {data.dailyTrend.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Günlük Devamsızlık Trendi</h2>
              <div className="flex items-end gap-1 h-32 overflow-x-auto">
                {data.dailyTrend.map(d => {
                  const maxVal = Math.max(...data.dailyTrend.map(x => x.absent + x.late), 1)
                  const h = Math.max(4, Math.round(((d.absent + d.late) / maxVal) * 120))
                  return (
                    <div key={d.date} className="flex flex-col items-center gap-1 min-w-[24px]" title={`${d.date}: ${d.absent} devamsız, ${d.late} geç`}>
                      <div className="w-5 bg-red-400 rounded-t" style={{ height: `${h}px` }} />
                      <span className="text-xs text-gray-300 rotate-90 origin-center mt-2" style={{ fontSize: '9px' }}>
                        {new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top 5 students */}
          {data.topStudents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3">En Çok Devamsız 5 Öğrenci</h2>
              <div className="space-y-2">
                {data.topStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <span className="text-xs text-gray-400">{s.className}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-red-600 font-semibold">{s.absent} devamsız</span>
                      <span className="text-amber-600">{s.late} geç</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Öğrenci Bazlı Özet</h2>
              <span className="text-xs text-gray-400">{data.studentStats.length} öğrenci</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Öğrenci</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Sınıf</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Devamsız</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Geç</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Mazeretli</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Devam %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentStats.sort((a, b) => b.absent - a.absent).map((s, i) => (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.className}</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{s.absent}</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber-600">{s.late}</td>
                      <td className="px-4 py-3 text-center text-blue-600">{s.excused}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${s.pct >= 90 ? 'text-green-600' : s.pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {s.pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
