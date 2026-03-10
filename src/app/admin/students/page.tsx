'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
  email: string
  class: {
    id: string
    name: string
  } | null
  createdAt: string
}

interface Class {
  id: string
  name: string
}

export default function AdminStudentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const studentsRes = await fetch('/api/admin/students')
      const studentsData = await studentsRes.json()
      
      const classesRes = await fetch('/api/admin/classes')
      const classesData = await classesRes.json()
      
      if (studentsData.success) setStudents(studentsData.students)
      if (classesData.success) setClasses(classesData.classes)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignClass = async (studentId: string, classId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/assign-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })

      if (response.ok) {
        alert('Student assigned to class!')
        setEditingStudent(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error:', error)
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
            <h1 className="text-2xl font-bold text-primary-600">Student Management</h1>
            <div className="flex gap-4">
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
          <h2 className="text-xl font-bold mb-4">All Students ({students.length})</h2>

          {students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students yet</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {editingStudent === student.id ? (
                        <>
                          <select
                            className="input-field"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                          >
                            <option value="">Select class...</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignClass(student.id, selectedClass)}
                            className="btn-primary text-sm"
                            disabled={!selectedClass}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStudent(null)}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {student.class ? (
                            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                              {student.class.name}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              No class assigned
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingStudent(student.id)
                              setSelectedClass(student.class?.id || '')
                            }}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                          >
                            {student.class ? 'Change' : 'Assign Class'}
                          </button>
                        </>
                      )}
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
