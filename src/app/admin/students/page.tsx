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

type TabType = 'list' | 'add' | 'import'

export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('list')
  
  // Add Student Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    classId: ''
  })
  
  // CSV Import
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<any>(null)
  
  // Edit
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editClassId, setEditClassId] = useState<string>('')

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

  // Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'STUDENT'
        })
      })

      if (response.ok) {
        alert('Student created!')
        setFormData({ name: '', email: '', password: '', classId: '' })
        setActiveTab('list')
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create student')
      }
    } catch (error) {
      alert('Something went wrong')
    }
  }

  // Assign Class
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

  // Delete Student
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Student deleted!')
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  // CSV Import
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
      fetchData()
    } catch (error) {
      alert('Failed to import')
    }
  }

  const downloadTemplate = () => {
    const template = 'name,email,password,role,className,subject\nAli Yilmaz,ali@school.com,pass123,STUDENT,9A,'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students-template.csv'
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
            <p className="text-gray-600 mt-1">Manage students, assign to classes</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ➕ Add Student
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📥 Import CSV
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Students</h2>
            
            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👨‍🎓</div>
                <p className="text-gray-500 mb-4">No students yet</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setActiveTab('add')} className="btn-primary">
                    Add First Student
                  </button>
                  <button onClick={() => setActiveTab('import')} className="btn-secondary">
                    Import CSV
                  </button>
                </div>
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
                              value={editClassId}
                              onChange={(e) => setEditClassId(e.target.value)}
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
                                onClick={() => handleAssignClass(student.id, editClassId)}
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
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setEditingStudent(student.id)
                                  setEditClassId(student.class?.id || '')
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g., Ali Yılmaz"
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
                    placeholder="ali@school.com"
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
                    Class
                  </label>
                  <select
                    className="input-field"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  >
                    <option value="">Select class...</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Add Student
              </button>
            </form>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Import Students from CSV</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>CSV Format:</strong> name, email, password, role, className, subject
              </p>
              <p className="text-sm text-blue-800 mb-2">
                For students, leave subject empty
              </p>
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                📄 Download Template
              </button>
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
                <div className={`border rounded-lg p-4 ${
                  importResults.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <p className="font-semibold mb-2">Import Results:</p>
                  <p className="text-sm">✅ Success: {importResults.success}</p>
                  <p className="text-sm">❌ Failed: {importResults.failed}</p>
                  {importResults.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Errors:</p>
                      <ul className="text-xs list-disc list-inside">
                        {importResults.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!csvFile}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Students
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
