'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Manager {
  id: string
  name: string
  email: string
  department: string | null
  _count: { socialPosts: number }
  createdAt: string
}

interface NewManager {
  name: string
  email: string
  password: string
  department: string
}

export default function SocialMediaManagersPage() {
  const router = useRouter()
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState<NewManager>({ name: '', email: '', password: '', department: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetch_ = async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/social-media-managers')
    const data = await res.json()
    if (data.success) setManagers(data.managers)
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/admin/social-media-managers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setManagers(prev => [data.manager, ...prev])
      setShowForm(false)
      setForm({ name: '', email: '', password: '', department: '' })
    } else {
      setError(data.error ?? 'Failed to create manager')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this social media manager?')) return
    setDeleting(id)
    await fetch(`/api/admin/social-media-managers/${id}`, { method: 'DELETE' })
    setManagers(prev => prev.filter(m => m.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">📱</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Social Media Managers</h1>
                <p className="text-xs text-gray-500">{managers.length} manager{managers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Manager</button>
              <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Add Manager Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Social Media Manager</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input className="input-field" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@school.edu" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input type="password" className="input-field" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Temporary password" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department (optional)</label>
                <input className="input-field" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Communications, Marketing…" />
              </div>
              {error && <p className="col-span-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>}
              <div className="col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Creating…' : 'Create Manager'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Managers list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No social media managers yet</h3>
            <p className="text-gray-500 text-sm mb-6">Add managers who will handle your school's social media presence.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Add Manager</button>
          </div>
        ) : (
          <div className="space-y-3">
            {managers.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">Social Media Manager</span>
                    {m.department && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.department}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{m.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m._count.socialPosts} post{m._count.socialPosts !== 1 ? 's' : ''} · Joined {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deleting === m.id}
                    className="text-xs px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {deleting === m.id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
