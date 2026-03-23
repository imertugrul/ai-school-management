'use client'

import { useEffect, useState } from 'react'
import AttendanceReviewPanel from '@/components/attendance/AttendanceReviewPanel'

export default function StaffAttendanceReviewPage() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/attendance-review?status=PENDING')
      .then(r => r.json())
      .then(d => setPendingCount(d.summary?.pending ?? 0))
      .catch(() => {})
  }, [])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devamsızlık Bildirim Onayı</h1>
          <p className="text-sm text-gray-500 mt-1">Yoklama bildirimlerini incele ve onayla</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">{pendingCount} bekliyor</span>
        )}
      </div>
      <AttendanceReviewPanel />
    </div>
  )
}
