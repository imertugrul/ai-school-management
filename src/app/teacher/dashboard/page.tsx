'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function TeacherDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">AI Grading System</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {session.user?.name}!</span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
          <p className="text-gray-600">Manage your tests, attendance, and view student results</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Tests</h3>
            <p className="text-4xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-1">No tests created yet</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Submissions</h3>
            <p className="text-4xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-1">No submissions yet</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Reviews</h3>
            <p className="text-4xl font-bold text-primary-600">0</p>
            <p className="text-sm text-gray-500 mt-1">All caught up!</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/teacher/tests/create')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Test</h3>
            <p className="text-gray-600 text-sm">
              Build a new test with AI-powered grading
            </p>
          </button>

          <button
            onClick={() => router.push('/teacher/tests')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">View All Tests</h3>
            <p className="text-gray-600 text-sm">
              See all tests, submissions, and analytics
            </p>
          </button>

          <button
            onClick={() => router.push('/teacher/attendance')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Take Attendance</h3>
            <p className="text-gray-600 text-sm">
              Mark daily attendance and notify parents
            </p>
          </button>

          <button
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left opacity-75"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">My Students</h3>
            <p className="text-gray-600 text-sm">
              Manage students and track progress
            </p>
            <span className="text-xs text-gray-500 mt-2 block">Coming Soon</span>
          </button>

          <button
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left opacity-75"
          >
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              View performance and improvement trends
            </p>
            <span className="text-xs text-gray-500 mt-2 block">Coming Soon</span>
          </button>

          <button
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left opacity-75"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule</h3>
            <p className="text-gray-600 text-sm">
              View and manage class timetable
            </p>
            <span className="text-xs text-gray-500 mt-2 block">Coming Soon</span>
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">✨ New Feature: Attendance System!</h3>
          <p className="text-green-700">
            Take daily attendance and AI will automatically notify parents about absences and late arrivals.
          </p>
        </div>
      </div>
    </div>
  )
}