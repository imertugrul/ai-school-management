'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface Overview {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalCourses: number
  totalTests: number
  totalSubmissions: number
}

interface GradeDistribution {
  A: number
  B: number
  C: number
  D: number
  F: number
}

interface SubjectPerformance {
  courseCode: string
  courseName: string
  averageScore: number
  gradeCount: number
}

interface ClassPerformance {
  className: string
  averageScore: number
  studentCount: number
}

interface StudentRanking {
  id: string
  name: string
  className: string
  averageScore: number
}

function LoadingCard() {
  return (
    <div className="card flex items-center justify-center py-12 shimmer">
      <p className="text-gray-400">Loading...</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  emoji,
  gradient,
  shadow,
}: {
  label: string
  value: number | null
  emoji: string
  gradient: string
  shadow: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg ${shadow}`}>
            <span className="text-xl">{emoji}</span>
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">
          {value !== null ? value.toLocaleString() : '—'}
        </p>
        <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

function PercentBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const barColor = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-12 text-right">{value}%</span>
    </div>
  )
}

function StudentTable({
  students,
  title,
  emoji
}: {
  students: StudentRanking[]
  title: string
  emoji: string
}) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 70) return 'text-blue-600'
    return 'text-red-500'
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-5 text-gray-900 border-l-4 border-blue-500 pl-4">
        {emoji} {title}
      </h2>
      {students.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-gray-500 text-sm">No students with at least 3 grades yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-gray-400">#{index + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-900">{student.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {student.className}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-bold text-base ${getScoreColor(student.averageScore)}`}>
                      {student.averageScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const router = useRouter()

  const [overview, setOverview] = useState<Overview | null>(null)
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution | null>(null)
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[] | null>(null)
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[] | null>(null)
  const [topStudents, setTopStudents] = useState<StudentRanking[] | null>(null)
  const [bottomStudents, setBottomStudents] = useState<StudentRanking[] | null>(null)

  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [overviewRes, gradesRes, subjectsRes, classesRes, topRes, bottomRes] =
        await Promise.allSettled([
          fetch('/api/admin/analytics/overview').then((r) => r.json()),
          fetch('/api/admin/analytics/grade-distribution').then((r) => r.json()),
          fetch('/api/admin/analytics/subject-performance').then((r) => r.json()),
          fetch('/api/admin/analytics/class-performance').then((r) => r.json()),
          fetch('/api/admin/analytics/top-students?type=top').then((r) => r.json()),
          fetch('/api/admin/analytics/top-students?type=bottom').then((r) => r.json())
        ])

      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setOverview(overviewRes.value)
      }
      setLoadingOverview(false)

      if (gradesRes.status === 'fulfilled' && gradesRes.value.success) {
        setGradeDistribution(gradesRes.value.distribution)
      }
      setLoadingGrades(false)

      if (subjectsRes.status === 'fulfilled' && subjectsRes.value.success) {
        setSubjectPerformance(subjectsRes.value.subjectPerformance)
      }
      setLoadingSubjects(false)

      if (classesRes.status === 'fulfilled' && classesRes.value.success) {
        setClassPerformance(classesRes.value.classPerformance)
      }
      setLoadingClasses(false)

      if (topRes.status === 'fulfilled' && topRes.value.success) {
        setTopStudents(topRes.value.students)
      }
      if (bottomRes.status === 'fulfilled' && bottomRes.value.success) {
        setBottomStudents(bottomRes.value.students)
      }
      setLoadingStudents(false)
    }

    fetchAll()
  }, [])

  const gradeChartData = gradeDistribution
    ? [
        { grade: 'A (90-100)', count: gradeDistribution.A, fill: '#10b981' },
        { grade: 'B (80-89)', count: gradeDistribution.B, fill: '#3b82f6' },
        { grade: 'C (70-79)', count: gradeDistribution.C, fill: '#f59e0b' },
        { grade: 'D (60-69)', count: gradeDistribution.D, fill: '#f97316' },
        { grade: 'F (<60)', count: gradeDistribution.F, fill: '#ef4444' }
      ]
    : []

  const maxSubjectScore = subjectPerformance
    ? Math.max(...subjectPerformance.map((s) => s.averageScore), 1)
    : 100

  const maxClassScore = classPerformance
    ? Math.max(...classPerformance.map((c) => c.averageScore), 1)
    : 100

  const overviewCards = overview ? [
    { label: 'Total Students', value: overview.totalStudents, emoji: '👨‍🎓', gradient: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/30' },
    { label: 'Total Teachers', value: overview.totalTeachers, emoji: '👨‍🏫', gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30' },
    { label: 'Total Classes', value: overview.totalClasses, emoji: '🏫', gradient: 'from-sky-500 to-sky-600', shadow: 'shadow-sky-500/30' },
    { label: 'Total Courses', value: overview.totalCourses, emoji: '📚', gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/30' },
    { label: 'Total Tests', value: overview.totalTests, emoji: '📝', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30' },
    { label: 'Total Submissions', value: overview.totalSubmissions, emoji: '📤', gradient: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/30' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-xs text-gray-500">School-wide performance overview</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/manage-panel')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ← Back to Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Section 1: Overview KPIs */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5 border-l-4 border-blue-500 pl-4">School Overview</h2>
          {loadingOverview ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse h-36 bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {overviewCards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  emoji={card.emoji}
                  gradient={card.gradient}
                  shadow={card.shadow}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Grade Distribution */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5 border-l-4 border-purple-500 pl-4">Grade Distribution</h2>
          {loadingGrades ? (
            <LoadingCard />
          ) : gradeDistribution ? (
            <div className="card">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={gradeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [value, 'Students']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-sm">
                {gradeChartData.map((g) => (
                  <div key={g.grade} className="rounded-xl py-2 px-1" style={{ backgroundColor: `${g.fill}15` }}>
                    <div className="font-bold text-lg" style={{ color: g.fill }}>
                      {g.count}
                    </div>
                    <div className="text-gray-500 text-xs font-medium">{g.grade.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500 text-sm">No grade data available yet</p>
            </div>
          )}
        </div>

        {/* Section 3 & 4: Subject and Class Performance */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5 border-l-4 border-emerald-500 pl-4">Subject Performance</h2>
            {loadingSubjects ? (
              <LoadingCard />
            ) : subjectPerformance && subjectPerformance.length > 0 ? (
              <div className="card space-y-4">
                {subjectPerformance.map((subject) => (
                  <div key={subject.courseCode}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{subject.courseName}</span>
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{subject.courseCode}</span>
                      </div>
                      <span className="text-xs text-gray-400">{subject.gradeCount} grades</span>
                    </div>
                    <PercentBar value={subject.averageScore} max={maxSubjectScore} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="text-5xl mb-3">📚</div>
                <p className="text-gray-500 text-sm">No subject data available yet</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5 border-l-4 border-orange-500 pl-4">Class Performance</h2>
            {loadingClasses ? (
              <LoadingCard />
            ) : classPerformance && classPerformance.length > 0 ? (
              <div className="card space-y-4">
                {classPerformance.map((cls) => (
                  <div key={cls.className}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{cls.className}</span>
                      <span className="text-xs text-gray-400">{cls.studentCount} students</span>
                    </div>
                    <PercentBar value={cls.averageScore} max={maxClassScore} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="text-5xl mb-3">🏫</div>
                <p className="text-gray-500 text-sm">No class data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 5 & 6: Student Rankings */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5 border-l-4 border-amber-500 pl-4">Student Rankings</h2>
          {loadingStudents ? (
            <div className="grid md:grid-cols-2 gap-6">
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <StudentTable
                students={topStudents ?? []}
                title="Top 10 Students"
                emoji="🏆"
              />
              <StudentTable
                students={bottomStudents ?? []}
                title="Needs Attention"
                emoji="📉"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
