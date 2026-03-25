'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const { data: session } = useSession()
  const router = useRouter()
  const [dashboardHref, setDashboardHref] = useState('/student/dashboard')

  useEffect(() => {
    const role = (session?.user as any)?.role
    if (role === 'ADMIN') setDashboardHref('/manage-panel')
    else if (role === 'TEACHER') setDashboardHref('/teacher/dashboard')
    else if (role === 'STUDENT') setDashboardHref('/student/dashboard')
    else if (role === 'PARENT') setDashboardHref('/parent/dashboard')
  }, [session])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)' }}>
          <span className="text-3xl">🏫</span>
        </div>

        {/* 404 number */}
        <p className="text-8xl font-black mb-2" style={{ color: '#E2E8F0', letterSpacing: '-4px', lineHeight: 1 }}>
          404
        </p>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push(dashboardHref)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: '#1E3A5F', boxShadow: '0 4px 14px rgba(30,58,95,0.3)' }}
          >
            Go to Dashboard
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all inline-block"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  )
}
