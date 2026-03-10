'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Class {
  id: string
  name: string
  _count: {
    students: number
  }
}

export default function TestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [test, setTest] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [testId])

  const fetchData = async () => {
    try {
      const testRes = await fetch(`/api/tests/${testId}`)
      const testData = await testRes.json()
      
      const classesRes = await fetch('/api/admin/classes')
      const classesData = await classesRes.json()
      
      if (testData.success) setTest(testData.test)
      if (classesData.success) setClasses(classesData.classes)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToClass = async () => {
    if (!selectedClass) {
      alert('Please select a class!')
      return
    }

    setAssigning(true)

    try {
      const response = await fetch(`/api/tests/${testId}/assign-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Success! Test assigned to ${data.assignedCount} students.`)
        setSelectedClass('')
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred!')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!test) {
    return <div className="min-h-screen flex items-center justify-center">Test not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">{test.title}</h1>
            <button 
              onClick={() => router.push('/teacher/tests')}
              className="btn-secondary"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Test Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Test Information</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Title:</strong> {test.title}</p>
            {test.subject && <p><strong>Subject:</strong> {test.subject}</p>}
            {test.description && <p><strong>Description:</strong> {test.description}</p>}
            <p><strong>Questions:</strong> {test.questions?.length || 0}</p>
            <p><strong>Status:</strong> {test.isActive ? '🟢 Active' : '⏸️ Inactive'}</p>
            <p><strong>Test Code:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{test.accessCode}</code></p>
          </div>
        </div>

        {/* Assign to Class */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">🎯 Assign to Class</h2>
          <p className="text-gray-600 mb-4">
            Select a class and this test will be automatically assigned to all students in that class.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={assigning}
              >
                <option value="">Select a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls._count.students} students)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignToClass}
              disabled={assigning || !selectedClass}
              className="btn-primary w-full disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign to Class'}
            </button>
          </div>

          {classes.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ No classes created yet. Create classes in the admin panel first.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
