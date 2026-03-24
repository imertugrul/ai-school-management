'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ComponentBar    from '@/components/analytics/ComponentBar'
import AttendanceTrend from '@/components/analytics/AttendanceTrend'
import RiskTable       from '@/components/analytics/RiskTable'
import { exportExcel, printReport } from '@/lib/exportReport'

interface ClassStats {
  avg: number | null
  attendanceRate: number | null
  maxGrade: number | null
  minGrade: number | null
  studentCount: number
}

interface ComponentAvg {
  id: string
  name: string
  type: string
  avg: number | null
  count: number
}

interface StudentPerf {
  id: string
  name: string
  class: string
  avg: number | null
  attendanceRate: number
}

interface AtRisk extends StudentPerf {
  riskFactors: string[]
}

interface TrendPoint {
  name: string
  avg: number | null
}

interface AnalyticsData {
  classStats: ClassStats | null
  componentAverages: ComponentAvg[]
  studentPerformance: StudentPerf[]
  trend: TrendPoint[]
  atRisk: AtRisk[]
  courses: { id: string; name: string }[]
  classes: { id: string; name: string }[]
}

function StatCard({ icon, title, value, sub, color }: { icon: string; title: string; value: string | number; sub?: string; color: string }) {
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

export default function TeacherAnalyticsPage() {
  const router = useRouter()
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [courseId, setCourseId] = useState('')
  const [classId, setClassId]   = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (courseId) params.set('courseId', courseId)
    if (classId)  params.set('classId',  classId)
    setLoading(true)
    fetch(`/api/analytics/teacher?${params}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [courseId, classId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleExport() {
    if (!data) return
    setExporting(true)
    try {
      await exportExcel({
        kpis: {
          Öğrenci: data.classStats?.studentCount ?? 0,
          'Sınıf Ortalaması': data.classStats?.avg ?? '—',
          'Devam Oranı': data.classStats?.attendanceRate ?? '—',
          'En Yüksek': data.classStats?.maxGrade ?? '—',
          'En Düşük': data.classStats?.minGrade ?? '—',
        },
        gradeDistribution: {},
        attendanceTrend: data.trend,
        atRiskStudents: data.atRisk,
        title: 'Öğretmen_Analitik',
      })
    } finally { setExporting(false) }
  }

  const stats = data?.classStats

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/teacher/dashboard')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
              <h1 className="text-lg font-bold text-gray-900">Analitik Dashboard</h1>
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
          <select value={courseId} onChange={e => setCourseId(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Dersler</option>
            {data?.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Sınıflar</option>
            {data?.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={fetchData} className="btn-secondary text-sm">🔄 Yenile</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon="👨‍🎓" title="Öğrenci Sayısı"  value={stats?.studentCount ?? '—'}       color="bg-teal-50" />
          <StatCard icon="📊" title="Sınıf Ortalaması"   value={stats?.avg ?? '—'}                color="bg-violet-50" />
          <StatCard icon="📅" title="Devam Oranı"        value={stats?.attendanceRate !== null && stats?.attendanceRate !== undefined ? `%${stats.attendanceRate}` : '—'} color="bg-green-50" />
          <StatCard icon="⬆️" title="En Yüksek"          value={stats?.maxGrade ?? '—'}           color="bg-blue-50" />
          <StatCard icon="⬇️" title="En Düşük"           value={stats?.minGrade ?? '—'}           color="bg-orange-50" />
        </div>

        {/* Component averages */}
        <Section title="Bileşen Ortalamaları">
          <ComponentBar
            data={(data?.componentAverages ?? []).map(c => ({ name: c.name, avg: c.avg, count: c.count }))}
            loading={loading}
            referenceValue={stats?.avg ?? undefined}
          />
        </Section>

        {/* Student performance table */}
        <Section title={`Öğrenci Performansı ${data?.studentPerformance.length ? `(${data.studentPerformance.length})` : ''}`}>
          {loading ? (
            <div className="h-32 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !data?.studentPerformance.length ? (
            <p className="text-center text-gray-400 py-8 text-sm">Veri yok</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Öğrenci</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Sınıf</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Ortalama</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Devam %</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentPerformance.map((s, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.class}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${s.avg !== null ? (s.avg >= 85 ? 'text-green-600' : s.avg >= 60 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {s.avg ?? '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${s.attendanceRate < 80 ? 'text-amber-600' : 'text-gray-700'}`}>
                        %{s.attendanceRate}
                      </td>
                      <td className="px-4 py-2.5">
                        {s.avg !== null && s.avg < 60 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Düşük Not</span>
                        ) : s.attendanceRate < 80 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Devamsızlık</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">İyi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Trend */}
        <Section title="Değerlendirme Trendi">
          {loading ? (
            <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : !data?.trend.length ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>
          ) : (
            <AttendanceTrend
              data={data.trend.map(t => ({ month: t.name, absent: 0, late: 0, present: t.avg ?? 0 }))}
              loading={false}
              showPresent
            />
          )}
        </Section>

        {/* At-risk */}
        <Section title={`Risk Altındaki Öğrenciler ${data?.atRisk.length ? `(${data.atRisk.length})` : ''}`}>
          <RiskTable
            data={(data?.atRisk ?? []).map(s => ({ student: s.name, class: s.class, avg: s.avg, attendanceRate: s.attendanceRate, riskFactors: s.riskFactors }))}
            loading={loading}
          />
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
