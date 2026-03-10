'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  notes: string | null
  student: {
    name: string
    email: string
  }
  class: {
    name: string
  }
  notifications: {
    type: string
    message: string
    sentAt: string
  }[]
}

export default function AttendanceHistory() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>('all')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/attendance/history')
      const data = await response.json()
      
      if (data.success) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      EXCUSED: 'bg-blue-100 text-blue-800'
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const filteredRecords = selectedClass === 'all' 
    ? records 
    : records.filter(r => r.class.name === selectedClass)

  const classes = Array.from(new Set(records.map(r => r.class.name)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
            <p className="text-gray-600 mt-1">View all attendance records and notifications</p>
          </div>
          <button
            onClick={() => router.push('/teacher/attendance')}
            className="btn-secondary"
          >
            ← Back to Attendance
          </button>
        </div>

        {/* Filter */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="all">All Classes</option>
            {classes.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>

        {/* Records */}
        {filteredRecords.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No attendance records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {record.student.name}
                    </h3>
                    <p className="text-sm text-gray-500">{record.student.email}</p>
                    <p className="text-sm text-gray-500">{record.class.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {record.notes}
                    </p>
                  </div>
                )}

                {record.notifications.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      📧 Notifications Sent:
                    </p>
                    {record.notifications.map((notif, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg mb-2">
                        <p className="text-xs text-gray-500 mb-1">
                          {notif.type} • {new Date(notif.sentAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-700">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
