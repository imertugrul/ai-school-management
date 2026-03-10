'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Teacher {
  id: string
  name: string
  email: string
  createdAt: string
  _count: {
    testsCreated: number
  }
}

export default function AdminTeachersPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers')
      const data = await response.json()
      
      if (data.success) {
        setTeachers(data.teachers)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Teacher Management</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/admin/students')}
                className="btn-secondary"
              >
                Students
              </button>
              <button 
                onClick={() => router.push('/admin/classes')}
                className="btn-secondary"
              >
                Classes
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">All Teachers ({teachers.length})</h2>

          {teachers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No teachers yet</p>
          ) : (
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        📝 {teacher._count.testsCreated} tests
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(teacher.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
