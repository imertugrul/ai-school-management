'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AttendanceReviewPanel from '@/components/attendance/AttendanceReviewPanel'

export default function AdminAttendanceReviewPage() {
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/attendance-review?status=PENDING')
      .then(r => r.json())
      .then(d => setPendingCount(d.summary?.pending ?? 0))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/manage-panel')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Devamsızlık Bildirim Onayı</h1>
                <p className="text-xs text-gray-500">Yoklama bildirimlerini incele ve onayla</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                {pendingCount} bekliyor
              </span>
            )}
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AttendanceReviewPanel />
      </div>
    </div>
  )
}
