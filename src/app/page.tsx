'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">AI School Management System</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-700 hover:text-primary-600">
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
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Save 10-15 Hours Per Week with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered school management platform for modern educators. Automated grading, 
            smart attendance tracking, and intelligent scheduling - all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => router.push('/signup')}
              className="btn-primary text-lg px-8 py-3"
            >
              Start Free Trial
            </button>
            <button className="btn-secondary text-lg px-8 py-3">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast Grading</h3>
            <p className="text-gray-600">
              Grade an entire class of essays in minutes, not hours. Get instant results 
              with AI-powered analysis and personalized feedback for every student.
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Attendance</h3>
            <p className="text-gray-600">
              Mark attendance in seconds with AI-generated parent notifications. 
              Track patterns, generate reports, and keep parents informed automatically.
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">You Stay in Control</h3>
            <p className="text-gray-600">
              Review and adjust any AI grade. Create custom rubrics and assessment criteria. 
              The AI assists, but you make the final decisions.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Create Test or Mark Attendance</h3>
              <p className="text-gray-600 text-sm">
                Build tests with multiple question types or quickly mark daily attendance for your classes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Students Participate</h3>
              <p className="text-gray-600 text-sm">
                Digital or paper assignments. Students take tests online or submit scanned work.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Processes</h3>
              <p className="text-gray-600 text-sm">
                Automatic grading with personalized feedback. AI-generated parent notifications for absences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Review & Share</h3>
              <p className="text-gray-600 text-sm">
                Quick review, adjust if needed, release results to students, and notify parents.
              </p>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
            Complete School Management Suite
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Everything you need to run your classroom efficiently
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card border-2 border-green-200 bg-green-50">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📝</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">AI Grading & Assessment</h3>
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">ACTIVE</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Automated grading for multiple choice, essays, code, and more. Personalized feedback for every student.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Multiple question types</li>
                    <li>✓ Custom rubrics</li>
                    <li>✓ Teacher review & override</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card border-2 border-green-200 bg-green-50">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📋</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Smart Attendance</h3>
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">ACTIVE</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Quick daily attendance with automated parent notifications and pattern tracking.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ One-click marking</li>
                    <li>✓ AI parent notifications</li>
                    <li>✓ Attendance analytics</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card border-2 border-blue-200 bg-blue-50 opacity-75">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📅</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Schedule Center</h3>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">COMING SOON</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    AI-powered timetable builder and class scheduling with conflict detection.
                  </p>
                </div>
              </div>
            </div>

            <div className="card border-2 border-blue-200 bg-blue-50 opacity-75">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📚</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Lesson Planner</h3>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">COMING SOON</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    AI lesson plan generator aligned with curriculum standards and learning objectives.
                  </p>
                </div>
              </div>
            </div>

            <div className="card border-2 border-blue-200 bg-blue-50 opacity-75">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📊</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Analytics & Reports</h3>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">COMING SOON</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Student performance insights, class trends, and automated parent reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="card border-2 border-blue-200 bg-blue-50 opacity-75">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💬</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Communication Hub</h3>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">COMING SOON</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    Parent-teacher messaging, announcements, and event management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teachers saving time with AI-powered school management
          </p>
          <button 
            onClick={() => router.push('/signup')}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Start Free Trial - No Credit Card Required
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">AI School Management System</h3>
            <p className="text-gray-400 mb-4">
              Empowering educators with artificial intelligence
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <Link href="/login" className="hover:text-white">Login</Link>
              <Link href="/signup" className="hover:text-white">Sign Up</Link>
              <span>Contact</span>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              © 2026 AI School Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}