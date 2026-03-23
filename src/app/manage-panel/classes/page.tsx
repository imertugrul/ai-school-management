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
  const [editingClass, setEditingClass] = useState<Class | null>(null)
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
      const url = editingClass
        ? `/api/admin/classes/${editingClass.id}`
        : '/api/admin/classes'

      const method = editingClass ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert(editingClass ? 'Class updated!' : 'Class created!')
        setShowForm(false)
        setEditingClass(null)
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

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      grade: cls.grade || '',
      section: cls.section || ''
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingClass(null)
    setFormData({ name: '', grade: '', section: '' })
    setShowForm(false)
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🏫</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Class Management</h1>
                <p className="text-xs text-gray-500">Create and organize classes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/manage-panel/students')}
                className="btn-secondary text-sm"
              >
                Students
              </button>
              <button
                onClick={() => router.push('/manage-panel/teachers')}
                className="btn-secondary text-sm"
              >
                Teachers
              </button>
              <button
                onClick={() => router.push('/manage-panel')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Panel
              </button>
              <button
                onClick={() => {
                  setEditingClass(null)
                  setFormData({ name: '', grade: '', section: '' })
                  setShowForm(!showForm)
                }}
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
            <h2 className="text-xl font-bold mb-4">
              {editingClass ? 'Edit Class' : 'Create New Class'}
            </h2>
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

              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
                {editingClass && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Classes ({classes.length})</h2>

          {classes.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏫</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes yet</h3>
              <p className="text-gray-500 text-sm mb-6">Create your first class to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                Create First Class
              </button>
            </div>
          ) : (
            <>
              {[9, 10, 11, 12].map(gradeLevel => {
                const gradeClasses = classes
                  .filter(cls => cls.grade === String(gradeLevel))
                  .sort((a, b) => a.name.localeCompare(b.name))

                if (gradeClasses.length === 0) return null

                return (
                  <div key={gradeLevel} className="mb-8">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Grade {gradeLevel}
                      </span>
                      <span className="text-sm text-gray-400">({gradeClasses.length} classes)</span>
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {gradeClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="group relative overflow-hidden border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer bg-white"
                          onClick={() => router.push(`/manage-panel/classes/${cls.id}`)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                          <div className="relative">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-2xl font-bold text-blue-600 group-hover:text-sky-700 transition-colors">{cls.name}</h3>
                              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleEdit(cls)} className="text-blue-500 hover:text-blue-700 text-sm font-semibold">Edit</button>
                                <button onClick={() => handleDelete(cls.id)} className="text-red-400 hover:text-red-600 text-sm font-semibold">Delete</button>
                              </div>
                            </div>
                            {cls.section && <p className="text-sm text-gray-500 mb-1">Section: {cls.section}</p>}
                            <p className="text-sm text-gray-600 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">👥</span>
                                {cls._count.students} students
                              </span>
                            </p>
                            <p className="text-xs text-sky-500 mt-3 font-semibold group-hover:opacity-100 opacity-0 transition-opacity">View details →</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {(() => {
                const noGradeClasses = classes
                  .filter(cls => !cls.grade)
                  .sort((a, b) => a.name.localeCompare(b.name))

                if (noGradeClasses.length === 0) return null

                return (
                  <div className="mb-8">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        Other Classes
                      </span>
                      <span className="text-sm text-gray-400">({noGradeClasses.length} classes)</span>
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {noGradeClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="group relative overflow-hidden border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-sky-300 transition-all cursor-pointer bg-white"
                          onClick={() => router.push(`/manage-panel/classes/${cls.id}`)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                          <div className="relative">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-2xl font-bold text-blue-600 group-hover:text-sky-700 transition-colors">{cls.name}</h3>
                              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleEdit(cls)} className="text-blue-500 hover:text-blue-700 text-sm font-semibold">Edit</button>
                                <button onClick={() => handleDelete(cls.id)} className="text-red-400 hover:text-red-600 text-sm font-semibold">Delete</button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">👥</span>
                                {cls._count.students} students
                              </span>
                            </p>
                            <p className="text-xs text-sky-500 mt-3 font-semibold group-hover:opacity-100 opacity-0 transition-opacity">View details →</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
