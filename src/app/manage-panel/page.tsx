'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const ACTION_CARDS = [
  {
    href: '/manage-panel/students',
    icon: '👨‍🎓',
    title: 'Manage Students',
    description: 'Add, edit, and manage student records',
    gradient: 'from-teal-500 to-teal-600',
    shadow: 'shadow-teal-500/30',
    hover: 'hover:border-teal-300',
    bg: 'from-teal-50/0 to-teal-50/80',
    text: 'hover:text-teal-700',
    link: 'text-teal-600',
  },
  {
    href: '/manage-panel/classes',
    icon: '🏫',
    title: 'Manage Classes',
    description: 'Create and organize school classes',
    gradient: 'from-sky-500 to-sky-600',
    shadow: 'shadow-sky-500/30',
    hover: 'hover:border-sky-300',
    bg: 'from-sky-50/0 to-sky-50/80',
    text: 'hover:text-sky-700',
    link: 'text-sky-600',
  },
  {
    href: '/manage-panel/teachers',
    icon: '👨‍🏫',
    title: 'Manage Teachers',
    description: 'Add and manage teaching staff',
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/30',
    hover: 'hover:border-amber-300',
    bg: 'from-amber-50/0 to-amber-50/80',
    text: 'hover:text-amber-700',
    link: 'text-amber-600',
  },
  {
    href: '/manage-panel/courses',
    icon: '📚',
    title: 'Manage Courses',
    description: 'Create and organize courses',
    gradient: 'from-violet-500 to-violet-600',
    shadow: 'shadow-violet-500/30',
    hover: 'hover:border-violet-300',
    bg: 'from-violet-50/0 to-violet-50/80',
    text: 'hover:text-violet-700',
    link: 'text-violet-600',
  },
  {
    href: '/manage-panel/course-assignments',
    icon: '📋',
    title: 'Course Assignments',
    description: 'Assign courses and classes to teachers',
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
    hover: 'hover:border-blue-300',
    bg: 'from-blue-50/0 to-blue-50/80',
    text: 'hover:text-blue-700',
    link: 'text-blue-600',
  },
  {
    href: '/manage-panel/schedules',
    icon: '📅',
    title: 'Manage Schedules',
    description: 'View and manage class schedules',
    gradient: 'from-green-500 to-green-600',
    shadow: 'shadow-green-500/30',
    hover: 'hover:border-green-300',
    bg: 'from-green-50/0 to-green-50/80',
    text: 'hover:text-green-700',
    link: 'text-green-600',
  },
  {
    href: '/manage-panel/school-settings',
    icon: '⚙️',
    title: 'School Settings',
    description: 'Configure school hours and breaks',
    gradient: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-500/30',
    hover: 'hover:border-orange-300',
    bg: 'from-orange-50/0 to-orange-50/80',
    text: 'hover:text-orange-700',
    link: 'text-orange-600',
  },
  {
    href: '/manage-panel/tests',
    icon: '📝',
    title: 'Manage Tests',
    description: 'Create and grade tests',
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
    hover: 'hover:border-blue-300',
    bg: 'from-blue-50/0 to-blue-50/80',
    text: 'hover:text-blue-700',
    link: 'text-blue-600',
  },
  {
    href: '/manage-panel/analytics',
    icon: '📊',
    title: 'Analytics',
    description: 'View school performance data',
    gradient: 'from-indigo-500 to-indigo-600',
    shadow: 'shadow-indigo-500/30',
    hover: 'hover:border-indigo-300',
    bg: 'from-indigo-50/0 to-indigo-50/80',
    text: 'hover:text-indigo-700',
    link: 'text-indigo-600',
  },
  {
    href: '/manage-panel/announcements',
    icon: '📢',
    title: 'Announcements',
    description: 'Post news and updates for the school',
    gradient: 'from-orange-500 to-amber-500',
    shadow: 'shadow-orange-500/30',
    hover: 'hover:border-orange-300',
    bg: 'from-orange-50/0 to-orange-50/80',
    text: 'hover:text-orange-700',
    link: 'text-orange-600',
  },
  {
    href: '/manage-panel/events',
    icon: '🗓️',
    title: 'Events',
    description: 'Manage school calendar and events',
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/30',
    hover: 'hover:border-rose-300',
    bg: 'from-rose-50/0 to-rose-50/80',
    text: 'hover:text-rose-700',
    link: 'text-rose-600',
  },
  {
    href: '/manage-panel/parents',
    icon: '👨‍👩‍👧',
    title: 'Parents',
    description: 'Link parents to students and manage access',
    gradient: 'from-teal-500 to-cyan-600',
    shadow: 'shadow-teal-500/30',
    hover: 'hover:border-teal-300',
    bg: 'from-teal-50/0 to-teal-50/80',
    text: 'hover:text-teal-700',
    link: 'text-teal-600',
  },
  {
    href: '/manage-panel/lesson-plans',
    icon: '📋',
    title: 'Lesson Plans',
    description: "View and review all teachers' lesson plans",
    gradient: 'from-violet-600 to-purple-700',
    shadow: 'shadow-violet-500/30',
    hover: 'hover:border-violet-300',
    bg: 'from-violet-50/0 to-purple-50/80',
    text: 'hover:text-violet-700',
    link: 'text-violet-600',
  },
  {
    href: '/manage-panel/social-media-managers',
    icon: '📱',
    title: 'Social Media',
    description: 'Manage social media managers and their access',
    gradient: 'from-pink-500 to-purple-600',
    shadow: 'shadow-pink-500/30',
    hover: 'hover:border-pink-300',
    bg: 'from-pink-50/0 to-purple-50/80',
    text: 'hover:text-pink-700',
    link: 'text-pink-600',
  },
  {
    href: '/manage-panel/staff',
    icon: '👔',
    title: 'Staff Management',
    description: 'Vice principal, counselor, and secretary accounts',
    gradient: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/30',
    hover: 'hover:border-indigo-300',
    bg: 'from-indigo-50/0 to-violet-50/80',
    text: 'hover:text-indigo-700',
    link: 'text-indigo-600',
  },
  {
    href: '/manage-panel/attendance-review',
    icon: '📋',
    title: 'Attendance Approval',
    description: 'Review absence notifications and send to guardians',
    gradient: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-500/30',
    hover: 'hover:border-red-300',
    bg: 'from-red-50/0 to-rose-50/80',
    text: 'hover:text-red-700',
    link: 'text-red-600',
  },
  {
    href: '/manage-panel/users/pending',
    icon: '⏳',
    title: 'Kullanıcı Onayları',
    description: 'Onay bekleyen kullanıcıları onayla veya reddet',
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/30',
    hover: 'hover:border-amber-300',
    bg: 'from-amber-50/0 to-amber-50/80',
    text: 'hover:text-amber-700',
    link: 'text-amber-600',
  },
  {
    href: '/manage-panel/documents',
    icon: '📄',
    title: 'Okul Belgeleri',
    description: 'Veliler için belge ve yönetmelik yükle',
    gradient: 'from-cyan-500 to-teal-600',
    shadow: 'shadow-cyan-500/30',
    hover: 'hover:border-cyan-300',
    bg: 'from-cyan-50/0 to-teal-50/80',
    text: 'hover:text-cyan-700',
    link: 'text-cyan-600',
  },
  {
    href: '/manage-panel/gdpr',
    icon: '🛡️',
    title: 'GDPR & Privacy',
    description: 'Data deletion logs and AI audit trail',
    gradient: 'from-slate-500 to-slate-700',
    shadow: 'shadow-slate-500/30',
    hover: 'hover:border-slate-300',
    bg: 'from-slate-50/0 to-slate-50/80',
    text: 'hover:text-slate-700',
    link: 'text-slate-600',
  },
  {
    href: '/manage-panel/settings/2fa',
    icon: '🔐',
    title: '2FA Settings',
    description: 'Enable or disable two-factor authentication',
    gradient: 'from-gray-700 to-gray-900',
    shadow: 'shadow-gray-700/30',
    hover: 'hover:border-gray-400',
    bg: 'from-gray-50/0 to-gray-100/80',
    text: 'hover:text-gray-800',
    link: 'text-gray-700',
  },
]

export default function AdminPage() {
  const router = useRouter()
  const [missingGuardians, setMissingGuardians] = useState<number | null>(null)
  const [pendingAbsences, setPendingAbsences]   = useState<number | null>(null)
  const [pendingUsers, setPendingUsers]         = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/guardians')
      .then(r => r.json())
      .then(data => {
        const students = data.students ?? []
        setMissingGuardians(students.filter((s: any) => s.guardians.length === 0).length)
      })
      .catch(() => {})

    fetch('/api/admin/absence-notifications?status=PENDING')
      .then(r => r.json())
      .then(data => setPendingAbsences(data.summary?.pending ?? 0))
      .catch(() => {})

    fetch('/api/admin/users/pending?status=PENDING')
      .then(r => r.json())
      .then(data => setPendingUsers(data.counts?.pending ?? 0))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">School Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h2>
          <p className="text-gray-500">Manage your school operations from one place</p>
        </div>

        {/* Pending users alert banner */}
        {pendingUsers !== null && pendingUsers > 0 && (
          <button
            onClick={() => router.push('/manage-panel/users/pending')}
            className="w-full mb-4 flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 text-left hover:bg-amber-100 transition-colors"
          >
            <span className="text-2xl">⏳</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                {pendingUsers} kullanıcı onay bekliyor
              </p>
              <p className="text-xs text-amber-600">Kullanıcı Onayları sayfasına git →</p>
            </div>
          </button>
        )}

        {/* Absence notifications alert banner */}
        {pendingAbsences !== null && pendingAbsences > 0 && (
          <button
            onClick={() => router.push('/manage-panel/attendance-review')}
            className="w-full mb-4 flex items-center gap-3 bg-red-50 border border-red-300 rounded-2xl px-5 py-4 text-left hover:bg-red-100 transition-colors"
          >
            <span className="text-2xl">⏳</span>
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">
                {pendingAbsences} absence notification(s) awaiting approval
              </p>
              <p className="text-xs text-red-600">Go to Attendance Approval Panel →</p>
            </div>
          </button>
        )}

        {/* Guardian alert banner */}
        {missingGuardians !== null && missingGuardians > 0 && (
          <button
            onClick={() => router.push('/manage-panel/parents')}
            className="w-full mb-6 flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 text-left hover:bg-amber-100 transition-colors"
          >
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                {missingGuardians} student(s) have missing guardian information
              </p>
              <p className="text-xs text-amber-600">Go to Guardian Management page →</p>
            </div>
          </button>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {ACTION_CARDS.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className={`group relative overflow-hidden text-left rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-xl ${card.hover} hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-2xl">{card.icon}</span>
                  </div>
                  {card.href === '/manage-panel/users/pending' && pendingUsers !== null && pendingUsers > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {pendingUsers} bekliyor
                    </span>
                  )}
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
