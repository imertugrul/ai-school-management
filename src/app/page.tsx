'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const redirectUser = async () => {
      if (status === 'loading') return
      
      if (session) {
        try {
          const response = await fetch('/api/auth/me')
          const data = await response.json()
          
          if (data.user?.role === 'ADMIN') {
            router.push('/admin')
          } else if (data.user?.role === 'TEACHER') {
            router.push('/teacher/dashboard')
          } else if (data.user?.role === 'STUDENT') {
            router.push('/student/dashboard')
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      }
    }

    redirectUser()
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">AI School Management</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Save 10-15 Hours Per Week <br />
            <span className="text-primary-600">with AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI-powered grading, smart attendance tracking, and automated parent notifications. 
            Let AI handle the busywork while you focus on teaching.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="card text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast Grading</h3>
            <p className="text-gray-600">
              AI grades essays and short answers in seconds. Review, adjust, and release results with one click.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Attendance</h3>
            <p className="text-gray-600">
              Mark attendance in 30 seconds. AI generates personalized parent notifications automatically.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-5xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You Stay in Control</h3>
            <p className="text-gray-600">
              AI suggests, you decide. Review every grade, edit any score, and maintain full control.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h4 className="font-semibold mb-2">Create Test</h4>
              <p className="text-sm text-gray-600">Add questions with answer keys and rubrics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h4 className="font-semibold mb-2">Students Submit</h4>
              <p className="text-sm text-gray-600">Students complete tests online or upload scans</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h4 className="font-semibold mb-2">AI Grades</h4>
              <p className="text-sm text-gray-600">AI evaluates answers in seconds with feedback</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
              <h4 className="font-semibold mb-2">Review & Release</h4>
              <p className="text-sm text-gray-600">Review grades, make adjustments, release results</p>
            </div>
          </div>
        </div>

        {/* Module Showcase */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Complete School Management Platform</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h4 className="font-bold text-gray-900">AI Grading</h4>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">ACTIVE</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Automated test grading with AI feedback</p>
            </div>

            <div className="card border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h4 className="font-bold text-gray-900">Smart Attendance</h4>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">ACTIVE</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Quick attendance with AI parent notifications</p>
            </div>

            <div className="card border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📅</span>
                <div>
                  <h4 className="font-bold text-gray-900">Schedule Center</h4>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">COMING SOON</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">AI-powered timetable creation</p>
            </div>

            <div className="card border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📝</span>
                <div>
                  <h4 className="font-bold text-gray-900">Lesson Planner</h4>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">COMING SOON</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Generate lesson plans with AI</p>
            </div>

            <div className="card border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📈</span>
                <div>
                  <h4 className="font-bold text-gray-900">Analytics</h4>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">COMING SOON</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Student progress tracking & insights</p>
            </div>

            <div className="card border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">💬</span>
                <div>
                  <h4 className="font-bold text-gray-900">Communication Hub</h4>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">COMING SOON</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Parent-teacher messaging platform</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card bg-gradient-to-r from-primary-500 to-purple-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Save Time?</h2>
          <p className="text-xl mb-8 text-primary-50">
            Join hundreds of teachers who have reclaimed their evenings and weekends.
          </p>
          <Link href="/signup" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg inline-block transition-colors">
            Start Free Trial Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4">© 2026 AI School Management System. All rights reserved.</p>
          <div className="flex gap-6 justify-center">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
