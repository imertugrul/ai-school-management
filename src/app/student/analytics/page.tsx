'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ReferenceLine, Cell,
  PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Component {
  name: string; type: string; weight: number
  score: number; maxScore: number; percentage: number; letterGrade: string
}

interface Course {
  courseId: string; courseName: string; courseCode: string
  studentAvg: number | null; classAvg: number | null
  letterGrade: string | null; rank: number | null
  components: Component[]
}

interface TestPoint {
  testId: string; testName: string; date: string
  studentScore: number; classAvg: number | null; maxScore: number
}

interface Analytics {
  kpis: {
    gpa: number; gpaChange: number
    bestCourse: { name: string; avg: number } | null
    attendanceRate: number
    testsCompleted: number; totalTests: number; lastTestScore: number | null
  }
  courseBreakdown: Course[]
  testTrend: TestPoint[]
  attendance: {
    thisMonth: { present: number; absent: number; late: number; excused: number; rate: number }
    monthlyTrend: { month: string; rate: number | null }[]
    recentAbsences: { date: string; status: string }[]
  }
  comparison: { radar: { subject: string; studentScore: number; classAvg: number }[]; summary: string }
  strengths: { type: string; name: string; avg: number; percentile: number | null; medal: string; tip: string | null }[]
  improvements: { type: string; name: string; avg: number; target: number | null; tip: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColor(pct: number) {
  if (pct >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' }
  if (pct >= 80) return { text: 'text-blue-600',    bg: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700' }
  if (pct >= 70) return { text: 'text-yellow-600',  bg: 'bg-yellow-500',  badge: 'bg-yellow-100 text-yellow-700' }
  if (pct >= 60) return { text: 'text-orange-600',  bg: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700' }
  return { text: 'text-red-600', bg: 'bg-red-500', badge: 'bg-red-100 text-red-700' }
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className ?? ''}`} />
}

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6']

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentAnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/student/analytics')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const noData = !loading && data && data.courseBreakdown.length === 0 &&
    data.testTrend.length === 0 && data.attendance.thisMonth.present + data.attendance.thisMonth.absent === 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main, #F8FAFC)' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
            >
              ← Back
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">📊 My Analytics</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — KPI CARDS
        ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
          </div>
        ) : data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GPA */}
            <div className="card">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">📊 GPA</p>
              <p className="text-3xl font-black text-gray-900">{data.kpis.gpa > 0 ? data.kpis.gpa.toFixed(1) : '—'}</p>
              <p className="text-sm text-gray-500 mt-1">out of 4.0</p>
              {data.kpis.gpaChange > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                  ↑ +{data.kpis.gpaChange} last month
                </span>
              )}
            </div>

            {/* Best Course */}
            <div className="card">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">📈 Best Course</p>
              {data.kpis.bestCourse ? (
                <>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{data.kpis.bestCourse.name}</p>
                  <p className={`text-2xl font-black mt-1 ${gradeColor(data.kpis.bestCourse.avg).text}`}>
                    {data.kpis.bestCourse.avg}%
                  </p>
                </>
              ) : (
                <p className="text-2xl font-black text-gray-300">—</p>
              )}
            </div>

            {/* Attendance */}
            <div className="card">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">📅 Attendance</p>
              <p className={`text-3xl font-black ${data.kpis.attendanceRate >= 90 ? 'text-emerald-600' : data.kpis.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                {data.kpis.attendanceRate}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.attendance.thisMonth.absent} absent, {data.attendance.thisMonth.late} late
              </p>
            </div>

            {/* Tests */}
            <div className="card">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">📝 Tests</p>
              <p className="text-3xl font-black text-gray-900">
                {data.kpis.testsCompleted}<span className="text-lg text-gray-400"> / {data.kpis.totalTests}</span>
              </p>
              {data.kpis.lastTestScore !== null && (
                <p className="text-sm text-gray-500 mt-1">Last: {data.kpis.lastTestScore}/100</p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — COURSE BREAKDOWN
        ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <SkeletonBlock className="h-64" />
        ) : data && data.courseBreakdown.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Grade Detail by Course</h2>
            <div className="space-y-3">
              {data.courseBreakdown
                .filter(c => c.studentAvg !== null)
                .sort((a, b) => (b.studentAvg ?? 0) - (a.studentAvg ?? 0))
                .map(course => {
                  const pct = course.studentAvg ?? 0
                  const col = gradeColor(pct)
                  const isOpen = expanded.has(course.courseId)
                  const aboveAvg = course.classAvg !== null && pct > course.classAvg

                  return (
                    <div key={course.courseId} className="border border-gray-100 rounded-2xl overflow-hidden">
                      {/* Header row */}
                      <button
                        onClick={() => toggle(course.courseId)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{course.courseName}</span>
                            <span className="text-xs text-gray-400">{course.courseCode}</span>
                            {course.classAvg !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${aboveAvg ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                {aboveAvg ? '↑ Above avg' : '↓ Below avg'}
                              </span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 relative h-2 bg-gray-100 rounded-full overflow-visible">
                            <div className={`h-full rounded-full transition-all ${col.bg}`} style={{ width: `${pct}%` }} />
                            {/* Class avg marker */}
                            {course.classAvg !== null && (
                              <div
                                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-400 rounded-full"
                                style={{ left: `${course.classAvg}%` }}
                                title={`Class avg: ${course.classAvg}%`}
                              />
                            )}
                          </div>
                          {course.classAvg !== null && (
                            <p className="text-xs text-gray-400 mt-1">Class avg: {course.classAvg}%</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className={`text-xl font-black ${col.text}`}>{pct}%</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{course.letterGrade}</span>
                          </div>
                          {course.rank !== null && (
                            <div className="text-center hidden sm:block">
                              <p className="text-xs text-gray-400">Rank</p>
                              <p className="text-sm font-bold text-gray-700">Top {course.rank}%</p>
                            </div>
                          )}
                          <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {/* Expanded component breakdown */}
                      {isOpen && course.components.length > 0 && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Component Breakdown</p>
                          <div className="space-y-2">
                            {course.components.map((comp, idx) => {
                              const cc = gradeColor(comp.percentage)
                              const barW = Math.round((comp.percentage / 100) * 100)
                              return (
                                <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-sm">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-gray-700 font-medium truncate">{comp.name}</span>
                                      <span className="text-xs text-gray-400 shrink-0">({comp.weight}%)</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${cc.bg}`} style={{ width: `${barW}%` }} />
                                    </div>
                                  </div>
                                  <span className="text-gray-600 text-xs tabular-nums whitespace-nowrap">
                                    {comp.score}/{comp.maxScore}
                                  </span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cc.badge}`}>
                                    {comp.letterGrade}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">Weighted average</span>
                            <span className={`font-bold ${col.text}`}>{pct}%</span>
                          </div>
                          {course.rank !== null && (
                            <p className="text-xs text-gray-400 mt-1 text-right">Your rank: Top {course.rank}% of class ↑</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
            {data.courseBreakdown.filter(c => c.studentAvg === null).length > 0 && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                {data.courseBreakdown.filter(c => c.studentAvg === null).length} course(s) have no grades recorded yet.
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — TEST TREND
        ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <SkeletonBlock className="h-72" />
        ) : data && data.testTrend.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Test Score Trend</h2>
            <p className="text-sm text-gray-500 mb-5">Your score vs class average over time</p>

            {data.testTrend.length >= 2 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.testTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={v => {
                      const d = new Date(v)
                      return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
                    }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload as TestPoint
                      return (
                        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
                          <p className="font-semibold text-gray-900 mb-1">{p.testName}</p>
                          <p className="text-gray-500">{p.date}</p>
                          <p className="text-blue-600 font-bold mt-1">Your score: {p.studentScore}</p>
                          {p.classAvg !== null && <p className="text-gray-500">Class avg: {p.classAvg}</p>}
                          {p.classAvg !== null && (
                            <p className={`text-xs font-medium mt-1 ${p.studentScore >= p.classAvg ? 'text-emerald-600' : 'text-red-500'}`}>
                              {p.studentScore >= p.classAvg ? `+${(p.studentScore - p.classAvg).toFixed(1)} above avg` : `${(p.studentScore - p.classAvg).toFixed(1)} below avg`}
                            </p>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line
                    type="monotone" dataKey="studentScore" name="Your Score"
                    stroke="#4F8EF7" strokeWidth={2.5} dot={{ fill: '#4F8EF7', r: 4 }} activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone" dataKey="classAvg" name="Class Average"
                    stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">At least 2 graded tests are needed to show the trend chart.</p>
            )}

            {/* Last 5 tests table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-2 font-medium">Test Name</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium text-right">Score</th>
                    <th className="pb-2 font-medium text-right">Class Avg</th>
                    <th className="pb-2 font-medium text-right">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...data.testTrend].reverse().slice(0, 5).map((t, i) => {
                    const diff = t.classAvg !== null ? t.studentScore - t.classAvg : null
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2.5 text-gray-700 font-medium max-w-[160px] truncate">{t.testName}</td>
                        <td className="py-2.5 text-gray-400 whitespace-nowrap">{t.date}</td>
                        <td className={`py-2.5 font-bold text-right ${gradeColor(t.studentScore).text}`}>{t.studentScore}</td>
                        <td className="py-2.5 text-gray-400 text-right">{t.classAvg ?? '—'}</td>
                        <td className={`py-2.5 text-right font-semibold text-xs ${diff === null ? 'text-gray-400' : diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {diff === null ? '—' : diff >= 0 ? `+${diff.toFixed(1)} ↑` : `${diff.toFixed(1)} ↓`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!loading && data && data.testTrend.length === 0 && (
          <div className="card text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📝</p>
            <p>No graded tests yet.</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — ATTENDANCE ANALYSIS
        ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <SkeletonBlock className="h-72" />
        ) : data && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Attendance Analysis</h2>
            <div className="grid md:grid-cols-2 gap-8">

              {/* Left — donut */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-4">This Month</p>
                {data.attendance.thisMonth.present + data.attendance.thisMonth.absent +
                 data.attendance.thisMonth.late + data.attendance.thisMonth.excused > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <PieChart width={180} height={180}>
                        <Pie
                          data={[
                            { name: 'Present', value: data.attendance.thisMonth.present },
                            { name: 'Absent',  value: data.attendance.thisMonth.absent },
                            { name: 'Late',    value: data.attendance.thisMonth.late },
                            { name: 'Excused', value: data.attendance.thisMonth.excused },
                          ].filter(d => d.value > 0)}
                          cx={85} cy={85} innerRadius={52} outerRadius={80}
                          paddingAngle={3} dataKey="value"
                        >
                          {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                        </Pie>
                      </PieChart>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-2xl font-black ${data.attendance.thisMonth.rate >= 90 ? 'text-emerald-600' : data.attendance.thisMonth.rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {data.attendance.thisMonth.rate}%
                        </span>
                        <span className="text-xs text-gray-400">Rate</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-sm">
                      {[
                        { label: 'Present', value: data.attendance.thisMonth.present, icon: '✅', color: 'text-emerald-700' },
                        { label: 'Absent',  value: data.attendance.thisMonth.absent,  icon: '❌', color: 'text-red-600' },
                        { label: 'Late',    value: data.attendance.thisMonth.late,    icon: '⏰', color: 'text-yellow-600' },
                        { label: 'Excused', value: data.attendance.thisMonth.excused, icon: '📋', color: 'text-blue-600' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span>{s.icon}</span>
                          <span className="text-gray-500">{s.label}:</span>
                          <span className={`font-bold ${s.color}`}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No attendance data this month.</p>
                )}
              </div>

              {/* Right — monthly bar */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-4">6-Month Trend</p>
                {data.attendance.monthlyTrend.some(m => m.rate !== null && m.rate > 0) ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.attendance.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip
                        formatter={(v) => [`${v}%`, 'Attendance']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }}
                      />
                      <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '90%', fill: '#EF4444', fontSize: 10, position: 'right' }} />
                      <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {data.attendance.monthlyTrend.map((entry, i) => (
                          <Cell key={i} fill={(entry.rate ?? 100) < 90 ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No monthly trend data available.</p>
                )}
              </div>
            </div>

            {/* Recent absences */}
            {data.attendance.recentAbsences.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-600 mb-3">Recent Absences</p>
                <div className="space-y-1.5">
                  {data.attendance.recentAbsences.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span>{a.status === 'ABSENT' ? '📅' : '⏰'}</span>
                      <span className="text-gray-600">{a.date}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a.status === 'ABSENT' ? 'Absent' : 'Late'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5 — CLASS COMPARISON
        ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <SkeletonBlock className="h-80" />
        ) : data && data.comparison.radar.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-1">How You Compare</h2>
            <p className="text-sm text-gray-500 mb-2">Your performance vs class average</p>
            {data.comparison.summary && (
              <p className="text-sm font-semibold text-blue-600 mb-5">📈 {data.comparison.summary}</p>
            )}

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Radar chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={data.comparison.radar}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#CBD5E1' }} />
                    <Radar name="You" dataKey="studentScore" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Class Avg" dataKey="classAvg" stroke="#CBD5E1" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Horizontal bar comparison */}
              <div className="space-y-3">
                {data.comparison.radar.map((item, i) => {
                  const diff = item.studentScore - item.classAvg
                  const col = gradeColor(item.studentScore)
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium text-gray-700 truncate max-w-[130px]">{item.subject}</span>
                        <span className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                        </span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-visible">
                        {/* Class avg bar (grey) */}
                        <div className="absolute h-full bg-gray-300 rounded-full opacity-60" style={{ width: `${item.classAvg}%` }} />
                        {/* Student bar */}
                        <div className={`absolute h-full rounded-full ${col.bg} opacity-80`} style={{ width: `${item.studentScore}%` }} />
                        {/* Labels */}
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-[10px] font-bold">
                          {item.studentScore}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Class avg: {item.classAvg}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6 — STRENGTHS & IMPROVEMENTS
        ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonBlock className="h-72" />
            <SkeletonBlock className="h-72" />
          </div>
        ) : data && (data.strengths.length > 0 || data.improvements.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* Strengths */}
            {data.strengths.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">💪 Strengths</h2>
                <div className="space-y-3">
                  {data.strengths.map((s, i) => {
                    const col = gradeColor(s.avg)
                    return (
                      <div key={i} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{s.medal}</span>
                          <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {s.avg}% avg{s.percentile !== null ? ` — Top ${s.percentile}% of class` : ''}
                        </p>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${col.bg}`} style={{ width: `${s.avg}%` }} />
                        </div>
                        <div className="flex justify-end mt-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                            {s.avg >= 97 ? 'A+' : s.avg >= 93 ? 'A' : s.avg >= 90 ? 'A-' : s.avg >= 87 ? 'B+' : s.avg >= 83 ? 'B' : s.avg >= 80 ? 'B-' : s.avg >= 77 ? 'C+' : s.avg >= 73 ? 'C' : 'C-'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Improvements */}
            {data.improvements.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Areas to Improve</h2>
                <div className="space-y-3">
                  {data.improvements.map((item, i) => {
                    const col = gradeColor(item.avg)
                    return (
                      <div key={i} className="border border-orange-50 rounded-2xl p-4 bg-orange-50/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">⚠️</span>
                          <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {item.type === 'attendance'
                            ? `${item.avg}% — ${item.target !== null ? `${item.target - item.avg}% below target` : ''}`
                            : `${item.avg}% avg${item.target !== null ? ` — Class avg: ${item.target}%` : ''}`
                          }
                        </p>
                        {item.type !== 'attendance' && (
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                            <div className={`h-full rounded-full ${col.bg}`} style={{ width: `${item.avg}%` }} />
                          </div>
                        )}
                        {item.target !== null && item.type === 'attendance' && (
                          <p className="text-xs text-gray-500">Target: {item.target}% minimum</p>
                        )}
                        {item.tip && (
                          <p className="text-xs text-gray-500 mt-2 italic">💡 {item.tip}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
        {noData && (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-xl font-bold text-gray-700">No data yet</p>
            <p className="text-gray-400 mt-2">Analytics will appear as your grades, tests, and attendance are recorded.</p>
          </div>
        )}

      </div>
    </div>
  )
}
