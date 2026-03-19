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
    <div className="card flex items-center justify-center py-12">
      <p className="text-gray-400">Loading...</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  emoji
}: {
  label: string
  value: number | null
  emoji: string
}) {
  return (
    <div className="card text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-3xl font-bold text-primary-600 mb-1">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function PercentBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div
          className="bg-primary-500 h-2.5 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-12 text-right">{value}%</span>
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
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">
        {emoji} {title}
      </h2>
      {students.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No students with at least 3 grades yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Rank</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Class</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 px-3 font-bold text-gray-400">#{index + 1}</td>
                  <td className="py-2 px-3 font-medium text-gray-900">{student.name}</td>
                  <td className="py-2 px-3 text-gray-600">{student.className}</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`font-bold ${
                        student.averageScore >= 90
                          ? 'text-green-600'
                          : student.averageScore >= 70
                          ? 'text-blue-600'
                          : 'text-red-500'
                      }`}
                    >
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
        { grade: 'A (90-100)', count: gradeDistribution.A, fill: '#22c55e' },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Analytics Dashboard</h1>
            <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">
              Back to Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Overview KPIs */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">School Overview</h2>
          {loadingOverview ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse h-28 bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard label="Total Students" value={overview?.totalStudents ?? null} emoji="👨‍🎓" />
              <StatCard label="Total Teachers" value={overview?.totalTeachers ?? null} emoji="👨‍🏫" />
              <StatCard label="Total Classes" value={overview?.totalClasses ?? null} emoji="🏫" />
              <StatCard label="Total Courses" value={overview?.totalCourses ?? null} emoji="📚" />
              <StatCard label="Total Tests" value={overview?.totalTests ?? null} emoji="📝" />
              <StatCard label="Total Submissions" value={overview?.totalSubmissions ?? null} emoji="📤" />
            </div>
          )}
        </div>

        {/* Section 2: Grade Distribution */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Grade Distribution</h2>
          {loadingGrades ? (
            <LoadingCard />
          ) : gradeDistribution ? (
            <div className="card">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [value, 'Students']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-sm">
                {gradeChartData.map((g) => (
                  <div key={g.grade}>
                    <div className="font-bold" style={{ color: g.fill }}>
                      {g.count}
                    </div>
                    <div className="text-gray-500 text-xs">{g.grade.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-8 text-gray-500">No grade data available yet</div>
          )}
        </div>

        {/* Section 3 & 4: Subject and Class Performance */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Subject Performance */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Subject Performance</h2>
            {loadingSubjects ? (
              <LoadingCard />
            ) : subjectPerformance && subjectPerformance.length > 0 ? (
              <div className="card space-y-3">
                {subjectPerformance.map((subject) => (
                  <div key={subject.courseCode}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{subject.courseName}</span>
                        <span className="ml-2 text-xs text-gray-400">({subject.courseCode})</span>
                      </div>
                      <span className="text-xs text-gray-400">{subject.gradeCount} grades</span>
                    </div>
                    <PercentBar value={subject.averageScore} max={maxSubjectScore} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500">No subject data available yet</div>
            )}
          </div>

          {/* Class Performance */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Class Performance</h2>
            {loadingClasses ? (
              <LoadingCard />
            ) : classPerformance && classPerformance.length > 0 ? (
              <div className="card space-y-3">
                {classPerformance.map((cls) => (
                  <div key={cls.className}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900 text-sm">{cls.className}</span>
                      <span className="text-xs text-gray-400">{cls.studentCount} students</span>
                    </div>
                    <PercentBar value={cls.averageScore} max={maxClassScore} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500">No class data available yet</div>
            )}
          </div>
        </div>

        {/* Section 5 & 6: Student Rankings */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Student Rankings</h2>
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
                title="Bottom 10 Students"
                emoji="📉"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
