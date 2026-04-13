'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    testsCreated: 0,
    studentsGraded: 0,
    averageScore: 0,
    classesCount: 0
  })

  useEffect(() => {
    fetch('/api/teacher/stats')
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.stats) })
      .catch(console.error)
  }, [])

  const initials = (session?.user?.name || 'T').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const statCards = [
    { icon: '📝', label: t('dashboard.teacher.testsCreated'), value: stats.testsCreated, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 group-hover:bg-blue-100', accent: 'from-blue-50' },
    { icon: '👥', label: t('dashboard.teacher.submissions'), value: stats.studentsGraded, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 group-hover:bg-purple-100', accent: 'from-purple-50' },
    { icon: '🎓', label: t('dashboard.teacher.classes'), value: stats.classesCount, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 group-hover:bg-emerald-100', accent: 'from-emerald-50' },
    { icon: '📊', label: t('dashboard.teacher.averageScore'), value: stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 group-hover:bg-orange-100', accent: 'from-orange-50' },
  ]

  const actionCards = [
    {
      href: '/teacher/tests',
      icon: '📝',
      title: 'Tests',
      description: 'Create tests, assign to classes and review submissions',
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30',
      hover: 'hover:border-blue-300',
      bg: 'from-blue-50/0 to-blue-50/80',
      text: 'hover:text-blue-700',
      link: 'text-blue-600',
    },
    {
      href: '/teacher/gradebook',
      icon: '📚',
      title: 'Grade Book',
      description: 'Manage grade components and enter student scores',
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/30',
      hover: 'hover:border-purple-300',
      bg: 'from-purple-50/0 to-purple-50/80',
      text: 'hover:text-purple-700',
      link: 'text-purple-600',
    },
    {
      href: '/teacher/schedule',
      icon: '📅',
      title: 'My Schedule',
      description: 'View your weekly teaching schedule',
      gradient: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/30',
      hover: 'hover:border-green-300',
      bg: 'from-green-50/0 to-green-50/80',
      text: 'hover:text-green-700',
      link: 'text-green-600',
    },
    {
      href: '/teacher/attendance',
      icon: '📋',
      title: 'Attendance',
      description: 'Mark and manage student attendance',
      gradient: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/30',
      hover: 'hover:border-orange-300',
      bg: 'from-orange-50/0 to-orange-50/80',
      text: 'hover:text-orange-700',
      link: 'text-orange-600',
    },
    {
      href: '/teacher/analytics',
      icon: '📊',
      title: 'Analytics',
      description: 'View class performance and insights',
      gradient: 'from-indigo-500 to-indigo-600',
      shadow: 'shadow-indigo-500/30',
      hover: 'hover:border-indigo-300',
      bg: 'from-indigo-50/0 to-indigo-50/80',
      text: 'hover:text-indigo-700',
      link: 'text-indigo-600',
    },
    {
      href: '/teacher/lesson-plans',
      icon: '📋',
      title: 'Lesson Plans',
      description: 'Create manual or AI-generated lesson plans',
      gradient: 'from-violet-600 to-purple-700',
      shadow: 'shadow-violet-500/30',
      hover: 'hover:border-violet-300',
      bg: 'from-violet-50/0 to-purple-50/80',
      text: 'hover:text-violet-700',
      link: 'text-violet-600',
    },
    {
      href: '/teacher/notes',
      icon: '🗒️',
      title: 'Teaching Notes',
      description: 'Quick notes, observations and student records',
      gradient: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/30',
      hover: 'hover:border-amber-300',
      bg: 'from-amber-50/0 to-amber-50/80',
      text: 'hover:text-amber-700',
      link: 'text-amber-600',
    },
    {
      href: '/teacher/library',
      icon: '📚',
      title: 'Question Library',
      description: 'Browse and reuse your saved questions',
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      hover: 'hover:border-blue-300',
      bg: 'from-blue-50/0 to-indigo-50/80',
      text: 'hover:text-blue-700',
      link: 'text-blue-600',
    },
    {
      href: '/announcements',
      icon: '📢',
      title: 'Announcements',
      description: 'View and post school announcements',
      gradient: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/30',
      hover: 'hover:border-orange-300',
      bg: 'from-orange-50/0 to-orange-50/80',
      text: 'hover:text-orange-700',
      link: 'text-orange-600',
    },
    {
      href: '/teacher/bulletins',
      icon: '📨',
      title: 'Performance Bulletins',
      description: 'Create and send monthly performance reports to parents',
      gradient: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-500/30',
      hover: 'hover:border-teal-300',
      bg: 'from-teal-50/0 to-cyan-50/80',
      text: 'hover:text-teal-700',
      link: 'text-teal-600',
    },
  ]

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
                <h1 className="text-lg font-bold text-gray-900">{t('dashboard.teacher.title')}</h1>
                <p className="text-xs text-gray-500">{t('dashboard.teacher.teachingPortal')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary text-sm"
              >
                {t('dashboard.common.logout')}
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-sm font-semibold">{initials}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.teacher.welcome')}, {session?.user?.name}!
          </h2>
          <p className="text-gray-500">{t('dashboard.teacher.welcomeSub')}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${s.accent} to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-60`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${s.bg} rounded-xl transition-colors`}>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-sm font-medium text-gray-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

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
