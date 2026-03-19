'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CourseGrade {
  courseCode: string
  courseName: string
  average: number | null
  components: { name: string; score: number | null; maxScore: number; weight: number }[]
}

interface AttendanceStats {
  rate: number
  present: number
  absent: number
  late: number
  total: number
}

interface TestStats {
  total: number
  submitted: number
  avgScore: number | null
}

export default function StudentAnalyticsPage() {
  const router = useRouter()
  const [grades, setGrades] = useState<CourseGrade[]>([])
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null)
  const [testStats, setTestStats] = useState<TestStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/student/grades').then(r => r.json()),
      fetch('/api/student/attendance').then(r => r.json()),
      fetch('/api/student/submissions').then(r => r.json()),
    ]).then(([gradesRes, attendanceRes, submissionsRes]) => {
      if (gradesRes.status === 'fulfilled' && gradesRes.value.success) {
        setGrades(gradesRes.value.courses || [])
      }
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.success) {
        setAttendance(attendanceRes.value.stats)
      }
      if (submissionsRes.status === 'fulfilled' && submissionsRes.value.success) {
        const subs = submissionsRes.value.submissions || []
        const done = subs.filter((s: any) => s.status === 'RELEASED' || s.status === 'GRADED')
        const scored = done.filter((s: any) => s.totalScore != null && s.maxScore)
        const avg = scored.length > 0
          ? scored.reduce((sum: number, s: any) => sum + (s.totalScore / s.maxScore) * 100, 0) / scored.length
          : null
        setTestStats({ total: subs.length, submitted: done.length, avgScore: avg ? Math.round(avg) : null })
      }
    }).finally(() => setLoading(false))
  }, [])

  const overallGPA = grades.length > 0
    ? grades.filter(c => c.average != null).reduce((sum, c) => sum + (c.average || 0), 0) /
      grades.filter(c => c.average != null).length
    : null

  const getGrade = (pct: number) => {
    if (pct >= 90) return { letter: 'A', color: 'text-green-600' }
    if (pct >= 80) return { letter: 'B', color: 'text-blue-600' }
    if (pct >= 70) return { letter: 'C', color: 'text-yellow-600' }
    if (pct >= 60) return { letter: 'D', color: 'text-orange-600' }
    return { letter: 'F', color: 'text-red-600' }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">My Analytics</h1>
            <button onClick={() => router.push('/student/dashboard')} className="btn-secondary">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            {overallGPA != null ? (
              <>
                <p className={`text-3xl font-bold ${getGrade(overallGPA).color}`}>
                  {getGrade(overallGPA).letter}
                </p>
                <p className="text-lg font-semibold text-gray-700">{Math.round(overallGPA)}%</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-300">—</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Overall GPA</p>
          </div>

          <div className="card text-center">
            <p className={`text-3xl font-bold ${attendance ? (attendance.rate >= 90 ? 'text-green-600' : attendance.rate >= 75 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-300'}`}>
              {attendance ? `${attendance.rate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Attendance</p>
          </div>

          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{grades.filter(c => c.average != null).length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Courses</p>
          </div>

          <div className="card text-center">
            <p className="text-3xl font-bold text-purple-600">
              {testStats?.avgScore != null ? `${testStats.avgScore}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Test Average</p>
          </div>
        </div>

        {/* Course Performance */}
        {grades.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance by Course</h2>
            <div className="space-y-4">
              {grades
                .filter(c => c.average != null)
                .sort((a, b) => (b.average || 0) - (a.average || 0))
                .map(c => {
                  const pct = Math.round(c.average || 0)
                  const { letter, color } = getGrade(pct)
                  return (
                    <div key={c.courseCode}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{c.courseName}</span>
                          <span className="ml-2 text-xs text-gray-400">{c.courseCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${color}`}>{letter}</span>
                          <span className="text-sm font-semibold text-gray-700">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 90 ? 'bg-green-500' : pct >= 80 ? 'bg-blue-500' : pct >= 70 ? 'bg-yellow-500' : pct >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Test Summary */}
        {testStats && testStats.total > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Test Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{testStats.total}</p>
                <p className="text-xs text-gray-500">Assigned</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{testStats.submitted}</p>
                <p className="text-xs text-gray-500">Graded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{testStats.avgScore != null ? `${testStats.avgScore}%` : '—'}</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Summary */}
        {attendance && attendance.total > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-4 gap-3 text-center mb-4">
              {[
                { label: 'Present', value: attendance.present, color: 'text-green-600' },
                { label: 'Absent',  value: attendance.absent,  color: 'text-red-600' },
                { label: 'Late',    value: attendance.late,    color: 'text-yellow-600' },
                { label: 'Total',   value: attendance.total,   color: 'text-gray-700' },
              ].map(s => (
                <div key={s.label}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/student/attendance')}
              className="text-sm text-primary-600 hover:underline"
            >
              View full attendance record →
            </button>
          </div>
        )}

        {grades.length === 0 && !testStats?.total && !attendance?.total && (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-500">No data available yet.</p>
            <p className="text-gray-400 text-sm mt-1">Analytics will appear as grades and attendance are recorded.</p>
          </div>
        )}

      </div>
    </div>
  )
}
