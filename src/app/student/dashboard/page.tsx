'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    averageGrade: 0,
    attendanceRate: 0,
    pendingTests: 0,
    isNinthGrade: false,
    unipathCompletion: 0,
  })

  useEffect(() => {
    fetch('/api/student/stats')
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats) })
      .catch(console.error)
  }, [])

  const initials = (session?.user?.name || 'S').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const statCards = [
    { icon: '📚', label: 'Courses', value: stats.coursesEnrolled, accent: 'from-blue-50' },
    { icon: '📊', label: 'Average Grade', value: stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A', accent: 'from-emerald-50' },
    { icon: '✅', label: 'Attendance', value: stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : 'N/A', accent: 'from-green-50' },
    { icon: '📝', label: 'Pending Tests', value: stats.pendingTests, accent: 'from-orange-50' },
  ]

  const actionCards = [
    {
      href: '/student/tests',
      icon: '📝',
      title: 'My Tests',
      description: 'View and take your assigned tests',
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30',
      hover: 'hover:border-blue-300',
      bg: 'from-blue-50/0 to-blue-50/80',
      text: 'hover:text-blue-700',
      link: 'text-blue-600',
    },
    {
      href: '/student/results',
      icon: '📈',
      title: 'Test Results',
      description: 'View your graded test scores and feedback',
      gradient: 'from-rose-500 to-rose-600',
      shadow: 'shadow-rose-500/30',
      hover: 'hover:border-rose-300',
      bg: 'from-rose-50/0 to-rose-50/80',
      text: 'hover:text-rose-700',
      link: 'text-rose-600',
    },
    {
      href: '/student/grades',
      icon: '🎓',
      title: 'My Grades',
      description: 'View course grades and weighted averages',
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/30',
      hover: 'hover:border-emerald-300',
      bg: 'from-emerald-50/0 to-emerald-50/80',
      text: 'hover:text-emerald-700',
      link: 'text-emerald-600',
    },
    {
      href: '/student/schedule',
      icon: '📅',
      title: 'My Schedule',
      description: 'View your weekly class schedule',
      gradient: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/30',
      hover: 'hover:border-green-300',
      bg: 'from-green-50/0 to-green-50/80',
      text: 'hover:text-green-700',
      link: 'text-green-600',
    },
    {
      href: '/student/attendance',
      icon: '📋',
      title: 'Attendance',
      description: 'View your attendance record',
      gradient: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/30',
      hover: 'hover:border-orange-300',
      bg: 'from-orange-50/0 to-orange-50/80',
      text: 'hover:text-orange-700',
      link: 'text-orange-600',
    },
    {
      href: '/student/analytics',
      icon: '📊',
      title: 'Analytics',
      description: 'Track your overall academic performance',
      gradient: 'from-indigo-500 to-indigo-600',
      shadow: 'shadow-indigo-500/30',
      hover: 'hover:border-indigo-300',
      bg: 'from-indigo-50/0 to-indigo-50/80',
      text: 'hover:text-indigo-700',
      link: 'text-indigo-600',
    },
    {
      href: '/announcements',
      icon: '📢',
      title: 'Announcements',
      description: 'School news, updates and notices',
      gradient: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/30',
      hover: 'hover:border-orange-300',
      bg: 'from-orange-50/0 to-orange-50/80',
      text: 'hover:text-orange-700',
      link: 'text-orange-600',
    },
    {
      href: '/events',
      icon: '🗓️',
      title: 'Events',
      description: 'Upcoming school events and activities',
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/30',
      hover: 'hover:border-rose-300',
      bg: 'from-rose-50/0 to-rose-50/80',
      text: 'hover:text-rose-700',
      link: 'text-rose-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-xs text-gray-500">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-sm font-semibold">{initials}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h2>
          <p className="text-gray-500">Here's your academic overview</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${s.accent} to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* UniPath Card — Grade 9 only */}
        {stats.isNinthGrade && (
          <div className="mb-6">
            <button
              onClick={() => router.push('/student/unipath')}
              className="group w-full text-left rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">🎓</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">University Advisor</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">NEW</span>
                    </div>
                    <p className="text-sm text-gray-500">AI-powered university application guide</p>
                  </div>
                </div>
                <span className="text-indigo-500 text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-indigo-700">Profile Completion</span>
                  <span className="text-xs font-bold text-indigo-600">{stats.unipathCompletion}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${stats.unipathCompletion}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-600 mt-2 font-medium">
                  {stats.unipathCompletion === 0
                    ? 'Start planning your university application with AI guidance →'
                    : stats.unipathCompletion < 50
                    ? 'Continue setting up your profile →'
                    : 'Your profile is looking great! Keep going →'}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actionCards.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className={`group relative overflow-hidden text-left rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-xl ${card.hover} hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
              <div className="relative">
                <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-white text-2xl">{card.icon}</span>
                </div>
                <h3 className={`text-lg font-bold text-gray-900 mb-1 ${card.text} transition-colors`}>{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
                <div className={`mt-4 flex items-center ${card.link} text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Open <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
