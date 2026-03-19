'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Teacher {
  id: string
  name: string
  email: string
  subject: string | null
}

type TabType = 'list' | 'add' | 'import'

export default function AdminTeachersPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('list')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subject: ''
  })

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<any>(null)

  const [editingTeacher, setEditingTeacher] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState<string>('')

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
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/teachers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'TEACHER'
        })
      })

      if (response.ok) {
        alert('Teacher created!')
        setFormData({ name: '', email: '', password: '', subject: '' })
        setActiveTab('list')
        fetchTeachers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create teacher')
      }
    } catch (error) {
      alert('Something went wrong')
    }
  }

  const handleUpdateSubject = async (teacherId: string, subject: string) => {
    try {
      const response = await fetch('/api/admin/teachers/update-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, subject: subject || null })
      })

      if (response.ok) {
        setEditingTeacher(null)
        fetchTeachers()
      }
    } catch (error) {
      console.error('Error updating subject:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Teacher deleted!')
        fetchTeachers()
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const user: any = {}
      headers.forEach((header, index) => {
        user[header] = values[index] || ''
      })
      return user
    }).filter(user => user.name && user.email)
  }

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return

    setImportResults(null)

    try {
      const text = await csvFile.text()
      const users = parseCSV(text)

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users })
      })

      const data = await response.json()
      setImportResults(data.results)
      setCsvFile(null)
      fetchTeachers()
    } catch (error) {
      alert('Failed to import')
    }
  }

  const downloadTemplate = () => {
    const template = 'name,email,password,role,className,subject\nMehmet Oz,mehmet@school.com,pass123,TEACHER,,Mathematics'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teachers-template.csv'
    a.click()
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">👨‍🏫</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Teacher Management</h1>
                <p className="text-xs text-gray-500">Manage teachers and their subjects</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            {([
              { key: 'list', label: `All Teachers (${teachers.length})` },
              { key: 'add', label: '+ Add Teacher' },
              { key: 'import', label: 'Import CSV' },
            ] as { key: TabType; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'list' && (
          <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">All Teachers</h2>
            </div>

            {teachers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👨‍🏫</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers yet</h3>
                <p className="text-gray-500 text-sm mb-6">Add your first teacher or import from CSV</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setActiveTab('add')} className="btn-primary">
                    Add First Teacher
                  </button>
                  <button onClick={() => setActiveTab('import')} className="btn-secondary">
                    Import CSV
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Email</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Subject</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-semibold">{getInitials(teacher.name)}</span>
                            </div>
                            <div className="font-medium text-gray-900">{teacher.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {teacher.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingTeacher === teacher.id ? (
                            <input
                              type="text"
                              className="input-field text-sm py-1.5"
                              placeholder="e.g., Mathematics"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              teacher.subject
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {teacher.subject || 'Not set'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingTeacher === teacher.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateSubject(teacher.id, editSubject)}
                                className="text-emerald-600 hover:text-emerald-800 font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTeacher(null)}
                                className="text-gray-500 hover:text-gray-700 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setEditingTeacher(teacher.id)
                                  setEditSubject(teacher.subject || '')
                                }}
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(teacher.id)}
                                className="text-red-500 hover:text-red-700 font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Teacher</h2>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., Mehmet Öz"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="mehmet@school.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="Min 6 characters"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Mathematics, Physics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Add Teacher
              </button>
            </form>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Import Teachers from CSV</h2>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 mb-6">
              <span className="text-blue-500 text-base mt-0.5">ℹ</span>
              <div>
                <p className="font-semibold mb-1">CSV Format: name, email, password, role, className, subject</p>
                <p>For teachers, set role=TEACHER and leave className empty</p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Download Template →
                </button>
              </div>
            </div>

            <form onSubmit={handleCSVImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="input-field"
                />
              </div>

              {importResults && (
                <div className={`flex items-start gap-3 p-4 border rounded-xl text-sm ${
                  importResults.failed === 0
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <div>
                    <p className="font-semibold mb-1">Import Results:</p>
                    <p>✓ Success: {importResults.success}</p>
                    <p>✗ Failed: {importResults.failed}</p>
                    {importResults.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="text-xs list-disc list-inside mt-1">
                          {importResults.errors.map((err: string, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!csvFile}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Teachers
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
