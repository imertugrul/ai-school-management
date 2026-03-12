'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
  email: string
  class: {
    id: string
    name: string
  } | null
}

interface Class {
  id: string
  name: string
}

export default function AdminStudentsPage() {
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
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/classes')
      ])

      const studentsData = await studentsRes.json()
      const classesData = await classesRes.json()

      if (studentsData.success) setStudents(studentsData.students)
      if (classesData.success) setClasses(classesData.classes)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignClass = async (studentId: string, classId: string) => {
    try {
      const response = await fetch('/api/admin/students/assign-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, classId: classId || null })
      })

      if (response.ok) {
        setEditingStudent(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error assigning class:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600 mt-1">Assign students to classes</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Students ({students.length})</h2>
          
          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍🎓</div>
              <p className="text-gray-500 mb-4">No students yet</p>
              <p className="text-gray-400 text-sm">Import students via CSV</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingStudent === student.id ? (
                          <select
                            className="input-field text-sm"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            autoFocus
                          >
                            <option value="">No class</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.class 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {student.class?.name || 'Not assigned'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingStudent === student.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAssignClass(student.id, selectedClass)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStudent(null)}
                              className="text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStudent(student.id)
                              setSelectedClass(student.class?.id || '')
                            }}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            Assign Class
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}