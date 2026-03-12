'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Class {
  id: string
  name: string
  grade: string | null
  section: string | null
  _count: {
    students: number
  }
}

export default function AdminClassesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    section: '',
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes')
      const data = await response.json()
      
      if (data.success) {
        setClasses(data.classes)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Please enter class name!')
      return
    }

    try {
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Class created!')
        setShowForm(false)
        setFormData({ name: '', grade: '', section: '' })
        fetchClasses()
      } else {
        alert(data.error || 'Error occurred!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred!')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const response = await fetch(`/api/admin/classes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Class deleted!')
        fetchClasses()
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
            <h1 className="text-2xl font-bold text-primary-600">Class Management</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => router.push('/admin/students')}
                className="btn-secondary text-sm"
              >
                Students
              </button>
              <button 
                onClick={() => router.push('/admin/teachers')}
                className="btn-secondary text-sm"
              >
                Teachers
              </button>
              <button 
                onClick={() => router.push('/admin/import')}
                className="btn-secondary text-sm"
              >
                Import
              </button>
              <button 
                onClick={() => router.push('/admin')}
                className="btn-secondary text-sm"
              >
                ← Panel
              </button>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="btn-primary text-sm"
              >
                {showForm ? 'Cancel' : '+ New Class'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., 9A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <select
                    className="input-field"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {[9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <select
                    className="input-field"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Create Class
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Classes ({classes.length})</h2>

          {classes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No classes created yet</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-primary-600">{cls.name}</h3>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  {cls.grade && <p className="text-sm text-gray-600">Grade: {cls.grade}</p>}
                  {cls.section && <p className="text-sm text-gray-600">Section: {cls.section}</p>}
                  <p className="text-sm text-gray-600">
                    👥 {cls._count.students} students
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}