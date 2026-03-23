'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student { id: string; name: string; email: string; class: { name: string } | null }
interface ParentUser {
  id: string
  name: string
  email: string
  children: { student: { id: string; name: string; email: string }; relationship: string }[]
}

export default function AdminParentsPage() {
  const router = useRouter()
  const [parents, setParents] = useState<ParentUser[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    parentEmail: '', parentName: '', studentId: '', relationship: 'Guardian'
  })

  useEffect(() => {
    fetchParents()
    fetchStudents()
  }, [])

  const fetchParents = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/parents')
    const data = await res.json()
    if (data.success) setParents(data.parents)
    setLoading(false)
  }

  const fetchStudents = async () => {
    const res = await fetch('/api/admin/students')
    const data = await res.json()
    if (data.success) setStudents(data.students)
  }

  const handleLink = async () => {
    if (!form.parentEmail || !form.studentId) {
      setError('Parent email and student are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/admin/parents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setSuccess(data.message || 'Parent linked successfully!')
      setShowForm(false)
      setForm({ parentEmail: '', parentName: '', studentId: '', relationship: 'Guardian' })
      if (data.tempPassword) {
        alert(`New parent account created!\nEmail: ${form.parentEmail}\nTemporary Password: ${data.tempPassword}\n\nPlease share this with the parent.`)
      }
      fetchParents()
    } else {
      setError(data.error || 'Failed to link parent')
    }
  }

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">👨‍👩‍👧</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Parent Management</h1>
                <p className="text-xs text-gray-500">Link parents to students</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Link Parent</button>
              <button onClick={() => router.push('/manage-panel')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 mb-6">
            <span>✓</span><span>{success}</span>
          </div>
        )}

        {showForm && (
          <div className="card mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Link Parent to Student</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500">If the parent doesn't have an account yet, a new one will be created with a temporary password.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Email *</label>
                <input type="email" className="input-field" value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="parent@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Name (for new accounts)</label>
                <input className="input-field" value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Student *</label>
                <select className="input-field" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.class ? `(${s.class.name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship</label>
                <select className="input-field" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
                  {['Mother', 'Father', 'Guardian', 'Grandparent', 'Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleLink} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Linking...' : 'Link Parent'}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : parents.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No parents linked yet</h3>
            <p className="text-gray-500 text-sm mb-6">Link parents to their children to give them portal access</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Link First Parent</button>
          </div>
        ) : (
          <div className="space-y-3">
            {parents.map(parent => (
              <div key={parent.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{initials(parent.name)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{parent.name}</h3>
                    <p className="text-sm text-gray-500">{parent.email}</p>
                    {parent.children.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {parent.children.map(link => (
                          <span key={link.student.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full font-medium">
                            👤 {link.student.name} <span className="text-blue-400">· {link.relationship}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
