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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card text-center">
          <p className="text-gray-500">No analytics data available</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your class performance and attendance patterns</p>
          </div>
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Tests</h3>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.totalTests}</p>
            <p className="text-xs text-gray-500 mt-1">Tests created</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Submissions</h3>
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.submittedSubmissions}</p>
            <p className="text-xs text-gray-500 mt-1">Of {data.stats.totalSubmissions} total</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Graded</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.stats.gradedSubmissions}</p>
            <p className="text-xs text-gray-500 mt-1">
              {data.stats.submittedSubmissions > 0 
                ? Math.round((data.stats.gradedSubmissions / data.stats.submittedSubmissions) * 100) 
                : 0}% completion
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{attendanceRate}%</p>
            <p className="text-xs text-gray-500 mt-1">{data.stats.totalAttendanceRecords} records</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Attendance Trends */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Attendance Trends (Last 30 Days)</h3>
            {data.charts.attendanceByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.charts.attendanceByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                  <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No attendance data yet</p>
            )}
          </div>

          {/* Attendance Distribution */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🥧 Attendance Distribution</h3>
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
              <p className="text-gray-500 text-center py-12">No attendance data yet</p>
            )}
          </div>
        </div>

        {/* Test Performance */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Test Performance Overview</h3>
          {data.charts.testPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.charts.testPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgScore" fill="#8884d8" name="Avg Score %" />
                <Bar yAxisId="right" dataKey="submissions" fill="#82ca9d" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No test data available</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Attendance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">✅ Present:</span>
                <span className="font-semibold text-green-600">{data.stats.presentCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">❌ Absent:</span>
                <span className="font-semibold text-red-600">{data.stats.absentCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">⏰ Late:</span>
                <span className="font-semibold text-yellow-600">{data.stats.lateCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">📝 Excused:</span>
                <span className="font-semibold text-blue-600">{data.stats.excusedCount}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Grading Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Submissions:</span>
                <span className="font-semibold">{data.stats.totalSubmissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-semibold text-blue-600">{data.stats.submittedSubmissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Graded:</span>
                <span className="font-semibold text-green-600">{data.stats.gradedSubmissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-orange-600">
                  {data.stats.submittedSubmissions - data.stats.gradedSubmissions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
