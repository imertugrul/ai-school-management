'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import GradeDonutChart from '@/components/analytics/GradeDonutChart'
import ClassBarChart   from '@/components/analytics/ClassBarChart'
import AttendanceTrend from '@/components/analytics/AttendanceTrend'
import RiskTable       from '@/components/analytics/RiskTable'
import { exportExcel, printReport } from '@/lib/exportReport'

const MONTHS = [
  { value: '', label: 'All Year' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' }, { value: '11', label: 'November' },
  { value: '12', label: 'December' }, { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' }, { value: '05', label: 'May' },
  { value: '06', label: 'June' },
]

interface AnalyticsData {
  kpis: { students: number; teachers: number; classes: number; avgGrade: number | null; attendanceRate: number | null; completedTests: number }
  gradeDistribution: { A: number; B: number; C: number; D: number; F: number; byClass: { class: string; avg: number | null }[] }
  attendanceTrend: { month: string; absent: number; late: number; excused: number; present: number }[]
  teacherPerformance: { teacher: string; courses: string; avgGrade: number | null; testCount: number }[]
  atRiskStudents: { student: string; class: string; avg: number | null; attendanceRate: number; riskFactors: string[] }[]
  aiUsage: { lessonPlans: number; gradedTests: number }
}

const TERM_YEAR = new Date().getFullYear()
const TERMS = [`${TERM_YEAR - 1}-${TERM_YEAR}`, `${TERM_YEAR}-${TERM_YEAR + 1}`]

function KPICard({ icon, title, value, sub, color }: { icon: string; title: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm`}>
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

export default function AdminAnalyticsPage() {
  const router  = useRouter()
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [classId, setClassId] = useState('')
  const [month, setMonth]     = useState('')
  const [term, setTerm]       = useState(TERMS[0])
  const [sortCol, setSortCol] = useState<'teacher' | 'avgGrade' | 'testCount'>('avgGrade')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(d => setClasses(d.classes ?? [])).catch(() => {})
  }, [])

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (classId) params.set('classId', classId)
    if (month) {
      const year = month === '01' || month === '02' || month === '03' || month === '04' || month === '05' || month === '06'
        ? term.split('-')[1] : term.split('-')[0]
      params.set('month', `${year}-${month}`)
    }
    setLoading(true)
    fetch(`/api/analytics/admin?${params}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [classId, month, term])

  useEffect(() => { fetchData() }, [fetchData])

  function sort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sortedTeachers = [...(data?.teacherPerformance ?? [])].sort((a, b) => {
    const av = sortCol === 'teacher' ? a.teacher : sortCol === 'avgGrade' ? (a.avgGrade ?? 0) : a.testCount
    const bv = sortCol === 'teacher' ? b.teacher : sortCol === 'avgGrade' ? (b.avgGrade ?? 0) : b.testCount
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  async function handleExportExcel() {
    if (!data) return
    setExporting(true)
    try {
      await exportExcel({
        kpis:              data.kpis as unknown as Record<string, unknown>,
        gradeDistribution: data.gradeDistribution as unknown as Record<string, unknown>,
        attendanceTrend:   data.attendanceTrend,
        atRiskStudents:    data.atRiskStudents,
        title:             'Admin_Analytics',
      })
    } finally { setExporting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/manage-panel')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
              <h1 className="text-lg font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportExcel} disabled={exporting || !data} className="btn-secondary text-sm disabled:opacity-50">
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
          <select value={term} onChange={e => setTerm(e.target.value)} className="input-field text-sm">
            {TERMS.map(t => <option key={t} value={t}>{t} Academic Year</option>)}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="input-field text-sm">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field text-sm">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={fetchData} className="btn-secondary text-sm">🔄 Refresh</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard icon="👨‍🎓" title="Total Students"    value={data?.kpis.students ?? '—'}       color="bg-teal-50" />
          <KPICard icon="👩‍🏫" title="Active Teachers"   value={data?.kpis.teachers ?? '—'}       color="bg-amber-50" />
          <KPICard icon="🏫" title="Classes"             value={data?.kpis.classes ?? '—'}        color="bg-sky-50" />
          <KPICard icon="📊" title="School Average"      value={data?.kpis.avgGrade ?? '—'}       color="bg-violet-50" />
          <KPICard icon="📅" title="Attendance Rate"     value={data?.kpis.attendanceRate !== null && data?.kpis.attendanceRate !== undefined ? `${data.kpis.attendanceRate}%` : '—'} color="bg-green-50" />
          <KPICard icon="📝" title="Completed Tests"     value={data?.kpis.completedTests ?? '—'} color="bg-blue-50" />
        </div>

        {/* Grade distribution + class averages */}
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Grade Distribution (Letter Grade)">
            <GradeDonutChart data={data?.gradeDistribution ?? null} loading={loading} />
          </Section>
          <Section title="Class-Based Averages">
            <ClassBarChart data={data?.gradeDistribution.byClass ?? []} loading={loading} />
          </Section>
        </div>

        {/* Attendance trend + by class */}
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Monthly Attendance Trend">
            <AttendanceTrend data={data?.attendanceTrend ?? []} loading={loading} />
          </Section>
          <Section title="Class-Based Attendance Rate">
            {loading ? (
              <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <ClassBarChart
                data={(data?.attendanceTrend ?? []).length > 0
                  ? (data?.gradeDistribution.byClass ?? []).map(c => ({ class: c.class, avg: c.avg }))
                  : []}
                loading={false}
              />
            )}
          </Section>
        </div>

        {/* Teacher performance */}
        <Section title="Teacher Performance">
          {loading ? (
            <div className="h-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : sortedTeachers.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      { col: 'teacher' as const, label: 'Teacher' },
                      { col: null, label: 'Subjects' },
                      { col: 'avgGrade' as const, label: 'Class Avg.' },
                      { col: 'testCount' as const, label: 'Exam Count' },
                    ].map(({ col, label }) => (
                      <th key={label} onClick={col ? () => sort(col) : undefined}
                        className={`text-left px-4 py-2.5 font-semibold text-gray-600 ${col ? 'cursor-pointer hover:text-gray-900' : ''}`}>
                        {label} {col === sortCol ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTeachers.map((t, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{t.teacher}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs max-w-xs truncate">{t.courses || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-bold ${t.avgGrade !== null ? (t.avgGrade >= 85 ? 'text-green-600' : t.avgGrade >= 70 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {t.avgGrade ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{t.testCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Risk students */}
        <Section title={`At-Risk Students ${data?.atRiskStudents.length ? `(${data.atRiskStudents.length})` : ''}`}>
          <RiskTable data={data?.atRiskStudents ?? []} loading={loading} />
        </Section>

        {/* AI usage */}
        {data?.aiUsage && (
          <Section title="AI Usage Statistics">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '📋', label: 'Lesson Plans', value: data.aiUsage.lessonPlans },
                { icon: '📊', label: 'Bulletins Sent', value: data.aiUsage.gradedTests },
              ].map(s => (
                <div key={s.label} className="bg-indigo-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-2xl font-bold text-indigo-700">{s.value}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Print styles */}
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
