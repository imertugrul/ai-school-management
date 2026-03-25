'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/lib/permissions'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

const STAFF_ROLES = [
  { value: 'VICE_PRINCIPAL', label: 'Vice Principal'     },
  { value: 'COUNSELOR',      label: 'Guidance Counselor' },
  { value: 'SECRETARY',      label: 'Secretary'          },
]

const ROLE_COLORS: Record<string, string> = {
  VICE_PRINCIPAL: 'bg-indigo-100 text-indigo-700',
  COUNSELOR:      'bg-teal-100 text-teal-700',
  SECRETARY:      'bg-amber-100 text-amber-700',
}

export default function AdminStaffPage() {
  const router = useRouter()
  const [staff, setStaff]       = useState<StaffMember[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VICE_PRINCIPAL' })

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchStaff = () => {
    setLoading(true)
    fetch('/api/admin/staff')
      .then(r => r.json())
      .then(d => setStaff(d.staff ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStaff() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Error', false); return }
      showToast(`${form.name} added`)
      setForm({ name: '', email: '', password: '', role: 'VICE_PRINCIPAL' })
      setShowForm(false)
      fetchStaff()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    const r = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    if (r.ok) {
      showToast(`${name} deleted`)
      fetchStaff()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/manage-panel')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
              <h1 className="text-lg font-bold text-gray-900">Staff Management</h1>
            </div>
            <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm">
              {showForm ? 'Cancel' : '+ New Staff Member'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-6">
          Manage staff accounts such as vice principals, guidance counselors, and secretaries.
          These users can access <strong>/staff-panel</strong>.
        </p>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Add New Staff Member</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field text-sm w-full" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field text-sm w-full" placeholder="jane@school.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field text-sm w-full" placeholder="At least 8 characters" minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field text-sm w-full">
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
                {submitting ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Role breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {STAFF_ROLES.map(r => (
            <div key={r.value} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{staff.filter(s => s.role === r.value).length}</div>
              <div className="text-xs text-gray-500 mt-1">{r.label}</div>
            </div>
          ))}
        </div>

        {/* Staff list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500">No staff members added yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Full Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Added</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-3 text-gray-500">{s.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[s.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[s.role] ?? s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(s.id, s.name)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
