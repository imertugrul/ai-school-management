'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
  email: string
  class: { id: string; name: string } | null
}

interface Class {
  id: string
  name: string
}

type TabType = 'list' | 'add' | 'import'

interface Toast {
  id:      number
  message: string
  type:    'success' | 'warning' | 'error'
}

// ─── Toast Component ─────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in ${
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
            : t.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="shrink-0 text-base">
            {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : '❌'}
          </span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600 shrink-0">✕</button>
        </div>
      ))}
    </div>
  )
}

// ─── KVKK Confirm Modal ───────────────────────────────────────────────────────
function KvkkModal({
  student,
  onConfirm,
  onCancel,
  deleting,
}: {
  student:   Student
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
}) {
  const [input, setInput] = useState('')
  const confirmed = input.trim() === student.name.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-red-100">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">This action cannot be undone!</h3>
            <p className="text-xs text-gray-500">GDPR Article 17 — Permanent Data Deletion</p>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm">
          <p className="font-semibold text-red-800 mb-2">
            The following data belonging to <span className="font-bold">{student.name}</span> will be permanently deleted:
          </p>
          <ul className="space-y-1 text-red-700">
            <li>• All exam results and answers</li>
            <li>• Grade records</li>
            <li>• Attendance records</li>
            <li>• Registration information</li>
            <li>• User account</li>
          </ul>
        </div>

        {/* Name confirmation input */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Type the student&apos;s name to continue:
          </label>
          <input
            className="input-field"
            placeholder={student.name}
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          {input && !confirmed && (
            <p className="text-xs text-red-500 mt-1">Name does not match. Enter exactly: <strong>{student.name}</strong></p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || deleting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Deleting…</>
              : <>🛡️ Delete Permanently</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents]             = useState<Student[]>([])
  const [classes, setClasses]               = useState<Class[]>([])
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState<TabType>('list')
  const [formData, setFormData]             = useState({ name: '', email: '', password: '', classId: '' })
  const [csvFile, setCsvFile]               = useState<File | null>(null)
  const [importResults, setImportResults]   = useState<any>(null)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editClassId, setEditClassId]       = useState<string>('')

  // KVKK delete state
  const [kvkkTarget, setKvkkTarget]         = useState<Student | null>(null)
  const [kvkkDeleting, setKvkkDeleting]     = useState(false)

  // Toast state
  const [toasts, setToasts]                 = useState<Toast[]>([])
  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([fetch('/api/admin/students'), fetch('/api/admin/classes')])
      const sData = await sRes.json()
      const cData = await cRes.json()
      if (sData.success) setStudents(sData.students)
      if (cData.success) setClasses(cData.classes)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/admin/students/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, role: 'STUDENT' }),
    })
    if (response.ok) {
      addToast('Student added successfully.', 'success')
      setFormData({ name: '', email: '', password: '', classId: '' })
      setActiveTab('list')
      fetchData()
    } else {
      const data = await response.json()
      addToast(data.error || 'Failed to add student.', 'error')
    }
  }

  const handleAssignClass = async (studentId: string, classId: string) => {
    const res = await fetch('/api/admin/students/assign-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId: classId || null }),
    })
    if (res.ok) { setEditingStudent(null); fetchData() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' })
    if (res.ok) { addToast('Student deleted.', 'success'); fetchData() }
  }

  // ─── KVKK Delete ─────────────────────────────────────────────────────────
  const handleKvkkDelete = async () => {
    if (!kvkkTarget) return
    setKvkkDeleting(true)
    try {
      const res  = await fetch(`/api/admin/gdpr/delete-student?studentId=${kvkkTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        setStudents(prev => prev.filter(s => s.id !== kvkkTarget.id))
        setKvkkTarget(null)
        if (data.parentEmailed) {
          addToast(`All data for ${data.studentName} has been deleted under GDPR and a notification email was sent to the guardian.`, 'success')
        } else if (!data.parentFound) {
          addToast(`Data deleted, but no registered guardian was found — email could not be sent.`, 'warning')
        } else {
          addToast(`Data deleted, but the email could not be sent.`, 'warning')
        }
      } else {
        addToast(data.error || 'Deletion failed.', 'error')
      }
    } catch {
      addToast('An error occurred, please try again.', 'error')
    } finally {
      setKvkkDeleting(false)
    }
  }

  // ─── CSV helpers ─────────────────────────────────────────────────────────
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const user: any = {}
      headers.forEach((h, i) => { user[h] = values[i] || '' })
      return user
    }).filter(u => u.name && u.email)
  }

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return
    setImportResults(null)
    const text  = await csvFile.text()
    const users = parseCSV(text)
    const res   = await fetch('/api/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users }) })
    const data  = await res.json()
    setImportResults(data.results)
    setCsvFile(null)
    fetchData()
  }

  const downloadTemplate = () => {
    const blob = new Blob(['name,email,password,role,className,subject\nAli Yilmaz,ali@school.com,pass123,STUDENT,9A,'], { type: 'text/csv' })
    const url  = window.URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'students-template.csv'; a.click()
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* KVKK Modal */}
      {kvkkTarget && (
        <KvkkModal
          student={kvkkTarget}
          onConfirm={handleKvkkDelete}
          onCancel={() => setKvkkTarget(null)}
          deleting={kvkkDeleting}
        />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">👨‍🎓</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Student Management</h1>
                <p className="text-xs text-gray-500">{students.length} student{students.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/manage-panel/gdpr')}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg transition-colors"
              >
                🛡️ GDPR Logs
              </button>
              <button
                onClick={() => router.push('/manage-panel')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            {([
              { key: 'list',   label: `All Students (${students.length})` },
              { key: 'add',    label: '+ Add Student' },
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

        {/* List tab */}
        {activeTab === 'list' && (
          <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">All Students</h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Red shield = GDPR deletion
              </div>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👨‍🎓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
                <p className="text-gray-500 text-sm mb-6">Add your first student or import from CSV</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setActiveTab('add')}    className="btn-primary">Add First Student</button>
                  <button onClick={() => setActiveTab('import')} className="btn-secondary">Import CSV</button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Email</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Class</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">

                        {/* Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-semibold">{getInitials(student.name)}</span>
                            </div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>

                        {/* Class */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingStudent === student.id ? (
                            <select
                              className="input-field text-sm py-1.5"
                              value={editClassId}
                              onChange={e => setEditClassId(e.target.value)}
                              autoFocus
                            >
                              <option value="">No class</option>
                              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.class ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {student.class?.name || 'Not assigned'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingStudent === student.id ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleAssignClass(student.id, editClassId)} className="text-emerald-600 hover:text-emerald-800 font-semibold">Save</button>
                              <button onClick={() => setEditingStudent(null)} className="text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingStudent(student.id); setEditClassId(student.class?.id || '') }}
                                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="text-red-400 hover:text-red-600 font-semibold text-sm"
                              >
                                Delete
                              </button>
                              {/* KVKK Delete */}
                              <button
                                onClick={() => setKvkkTarget(student)}
                                title="Permanently deletes all student data under GDPR"
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg text-xs font-semibold transition-all"
                              >
                                🛡️ Delete All Data
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

        {/* Add tab */}
        {activeTab === 'add' && (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
                  <input type="text" required className="input-field" placeholder="e.g., John Smith"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" required className="input-field" placeholder="ali@school.com"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input type="password" required className="input-field" placeholder="Min 6 characters" minLength={6}
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select className="input-field" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}>
                    <option value="">Select class...</option>
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary">Add Student</button>
            </form>
          </div>
        )}

        {/* Import tab */}
        {activeTab === 'import' && (
          <div className="card max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Import Students from CSV</h2>
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 mb-6">
              <span className="text-blue-500 text-base mt-0.5">ℹ</span>
              <div>
                <p className="font-semibold mb-1">CSV Format: name, email, password, role, className, subject</p>
                <p>For students, leave subject empty</p>
                <button onClick={downloadTemplate} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold">Download Template →</button>
              </div>
            </div>
            <form onSubmit={handleCSVImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
                <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} className="input-field" />
              </div>
              {importResults && (
                <div className={`flex items-start gap-3 p-4 border rounded-xl text-sm ${
                  importResults.failed === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <div>
                    <p className="font-semibold mb-1">Import Results:</p>
                    <p>✓ Success: {importResults.success}</p>
                    <p>✗ Failed: {importResults.failed}</p>
                    {importResults.errors?.length > 0 && (
                      <ul className="text-xs list-disc list-inside mt-2">
                        {importResults.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              <button type="submit" disabled={!csvFile} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Import Students</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
