'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AttendanceTrend from '@/components/analytics/AttendanceTrend'
import { exportStaffExcel, printReport } from '@/lib/exportReport'

const MONTHS = [
  { value: '', label: 'Bu Ay' },
  { value: '09', label: 'Eylül' }, { value: '10', label: 'Ekim' }, { value: '11', label: 'Kasım' },
  { value: '12', label: 'Aralık' }, { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' },
  { value: '03', label: 'Mart' }, { value: '04', label: 'Nisan' }, { value: '05', label: 'Mayıs' },
  { value: '06', label: 'Haziran' },
]

interface Summary {
  totalAbsent: number
  totalLate: number
  worstClass: string
  notified: number
  pending: number
}

interface TrendPoint {
  month: string
  absent: number
  late: number
  present: number
}

interface ClassRow {
  class: string
  absences: number
  total: number
  rate: number
}

interface ChronicStudent {
  student: string
  class: string
  days: number
  notified: boolean
}

interface AnalyticsData {
  summary: Summary
  trend: TrendPoint[]
  byClass: ClassRow[]
  chronicAbsent: ChronicStudent[]
  classes: { id: string; name: string }[]
}

function SummaryCard({ icon, title, value, sub, color }: { icon: string; title: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function StaffAnalyticsPage() {
  const router = useRouter()
  const [data, setData]         = useState<AnalyticsData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [month, setMonth]       = useState('')
  const [classId, setClassId]   = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (classId) params.set('classId', classId)
    if (month) {
      const year = ['01','02','03','04','05','06'].includes(month)
        ? new Date().getFullYear()
        : new Date().getFullYear()
      params.set('month', `${year}-${month}`)
    }
    setLoading(true)
    fetch(`/api/analytics/staff?${params}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [month, classId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleExport() {
    if (!data) return
    setExporting(true)
    try {
      await exportStaffExcel({
        summary: {
          'Toplam Devamsızlık': data.summary.totalAbsent,
          'Toplam Geç Kalma':  data.summary.totalLate,
          'En Kötü Sınıf':    data.summary.worstClass,
          'Bildirilen':        data.summary.notified,
          'Bekleyen':          data.summary.pending,
        },
        trend:         data.trend,
        byClass:       data.byClass,
        chronicAbsent: data.chronicAbsent,
      })
    } finally { setExporting(false) }
  }

  const s = data?.summary

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/staff-panel')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
              <h1 className="text-lg font-bold text-gray-900">Devamsızlık Raporları</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} disabled={exporting || !data} className="btn-secondary text-sm disabled:opacity-50">
                📊 Excel
              </button>
              <button onClick={printReport} className="btn-secondary text-sm">
                📥 PDF
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 print:hidden">
          <select value={month} onChange={e => setMonth(e.target.value)} className="input-field text-sm">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Sınıflar</option>
            {data?.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={fetchData} className="btn-secondary text-sm">🔄 Yenile</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard icon="❌" title="Devamsızlık"    value={s?.totalAbsent ?? '—'}  color="bg-red-50" />
          <SummaryCard icon="⏰" title="Geç Kalma"      value={s?.totalLate   ?? '—'}  color="bg-amber-50" />
          <SummaryCard icon="🏫" title="En Kötü Sınıf" value={s?.worstClass  || '—'}  color="bg-orange-50" />
          <SummaryCard icon="✅" title="Bildirilen"     value={s?.notified    ?? '—'}  color="bg-green-50" />
          <SummaryCard icon="⏳" title="Bekleyen"       value={s?.pending     ?? '—'}  color="bg-yellow-50" />
        </div>

        {/* Trend */}
        <Section title="Aylık Devamsızlık Trendi (Son 6 Ay)">
          <AttendanceTrend data={data?.trend ?? []} loading={loading} />
        </Section>

        {/* By-class */}
        <Section title="Sınıf Bazlı Devamsızlık">
          {loading ? (
            <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !data?.byClass.length ? (
            <p className="text-center text-gray-400 py-8 text-sm">Veri yok</p>
          ) : (
            <div className="space-y-2">
              {data.byClass.map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-600 truncate shrink-0">{row.class}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.rate >= 20 ? 'bg-red-500' : row.rate >= 10 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(row.rate * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-16 text-right shrink-0">
                    %{row.rate} <span className="text-gray-400 font-normal text-xs">({row.absences})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Chronic absentees */}
        <Section title={`Kronik Devamsızlar ${data?.chronicAbsent.length ? `(${data.chronicAbsent.length})` : ''}`}>
          {loading ? (
            <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !data?.chronicAbsent.length ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-400">Kronik devamsız öğrenci yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Öğrenci</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Sınıf</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Gün</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Bildirim</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chronicAbsent.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{row.student}</td>
                      <td className="px-4 py-2.5 text-gray-500">{row.class}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-bold ${row.days >= 5 ? 'text-red-600' : 'text-amber-600'}`}>{row.days}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {row.notified ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Bildirildi</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Bekliyor</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      <style jsx global>{`
        @media print {
          nav, button, .print\\:hidden { display: none !important; }
          body { background: white; }
          .bg-white { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
