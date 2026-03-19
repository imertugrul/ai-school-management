'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  stats: {
    totalTests: number
    totalSubmissions: number
    submittedSubmissions: number
    gradedSubmissions: number
    totalAttendanceRecords: number
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
  }
  charts: {
    attendanceByDate: any[]
    testPerformance: any[]
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/teacher/analytics')
      const result = await response.json()

      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No analytics data yet</h3>
          <p className="text-gray-500 text-sm">Data will appear here as you create tests and mark attendance</p>
        </div>
      </div>
    )
  }

  const attendancePieData = [
    { name: 'Present', value: data.stats.presentCount },
    { name: 'Absent', value: data.stats.absentCount },
    { name: 'Late', value: data.stats.lateCount },
    { name: 'Excused', value: data.stats.excusedCount }
  ]

  const attendanceRate = data.stats.totalAttendanceRecords > 0
    ? Math.round((data.stats.presentCount / data.stats.totalAttendanceRecords) * 100)
    : 0

  const kpiCards = [
    { label: 'Total Tests', value: data.stats.totalTests, icon: '📝', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', bg: 'bg-blue-50' },
    { label: 'Submissions', value: data.stats.submittedSubmissions, icon: '📄', color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', bg: 'bg-purple-50' },
    { label: 'Graded', value: data.stats.gradedSubmissions, icon: '✅', color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30', bg: 'bg-emerald-50' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: '📊', color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/30', bg: 'bg-orange-50' },
  ]

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
                <p className="text-xs text-gray-500">Track class performance and attendance patterns</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${kpi.bg} rounded-xl`}>
                    <span className="text-2xl">{kpi.icon}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{kpi.value}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Attendance Trends */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-5 border-l-4 border-blue-500 pl-4">
              Attendance Trends (Last 30 Days)
            </h3>
            {data.charts.attendanceByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.charts.attendanceByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" dot={false} />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" dot={false} />
                  <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📈</div>
                <p className="text-gray-500 text-sm">No attendance data yet</p>
              </div>
            )}
          </div>

          {/* Attendance Distribution */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-5 border-l-4 border-purple-500 pl-4">
              Attendance Distribution
            </h3>
            {data.stats.totalAttendanceRecords > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🥧</div>
                <p className="text-gray-500 text-sm">No attendance data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Test Performance */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-5 border-l-4 border-indigo-500 pl-4">
            Test Performance Overview
          </h3>
          {data.charts.testPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.charts.testPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgScore" fill="#6172f3" name="Avg Score %" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="submissions" fill="#10b981" name="Submissions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500 text-sm">No test data available</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-5 border-l-4 border-emerald-500 pl-4">Attendance Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Present', value: data.stats.presentCount, color: 'text-emerald-600', bar: 'bg-emerald-500' },
                { label: 'Absent', value: data.stats.absentCount, color: 'text-red-600', bar: 'bg-red-500' },
                { label: 'Late', value: data.stats.lateCount, color: 'text-amber-600', bar: 'bg-amber-500' },
                { label: 'Excused', value: data.stats.excusedCount, color: 'text-blue-600', bar: 'bg-blue-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-16">{s.label}:</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.bar}`}
                      style={{ width: `${data.stats.totalAttendanceRecords > 0 ? (s.value / data.stats.totalAttendanceRecords) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={`font-bold text-sm w-8 text-right ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-5 border-l-4 border-blue-500 pl-4">Grading Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Submissions:</span>
                <span className="font-bold text-gray-900">{data.stats.totalSubmissions}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Submitted:</span>
                <span className="font-bold text-blue-600">{data.stats.submittedSubmissions}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Graded:</span>
                <span className="font-bold text-emerald-600">{data.stats.gradedSubmissions}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="font-bold text-orange-600">
                  {data.stats.submittedSubmissions - data.stats.gradedSubmissions}
                </span>
              </div>
              {/* Progress bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Grading completion</span>
                  <span>{data.stats.submittedSubmissions > 0 ? Math.round((data.stats.gradedSubmissions / data.stats.submittedSubmissions) * 100) : 0}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: `${data.stats.submittedSubmissions > 0 ? (data.stats.gradedSubmissions / data.stats.submittedSubmissions) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
