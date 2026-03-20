'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  category: string
  isPinned: boolean
  publishedAt: string
  expiresAt: string | null
  author: { id: string; name: string; role: string }
  targetRoles: string[]
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  LOW: 'bg-gray-100 text-gray-600'
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    category: 'General',
    targetRoles: [] as string[],
    isPinned: false,
    expiresAt: ''
  })

  const fetchAnnouncements = () => {
    setLoading(true)
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => { if (data.success) setAnnouncements(data.announcements) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const handleRoleToggle = (role: string) => {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expiresAt: form.expiresAt || null
        })
      })
      if (res.ok) {
        setForm({
          title: '', content: '', priority: 'MEDIUM', category: 'General',
          targetRoles: [], isPinned: false, expiresAt: ''
        })
        setShowForm(false)
        fetchAnnouncements()
      }
    } catch (error) {
      console.error('Failed to create announcement:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    fetchAnnouncements()
  }

  const handlePin = async (id: string, isPinned: boolean) => {
    await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !isPinned })
    })
    fetchAnnouncements()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="btn-secondary text-sm">
                ← Back
              </button>
              <h1 className="text-lg font-bold text-gray-900">Manage Announcements</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary text-sm"
            >
              {showForm ? '✕ Cancel' : '+ New Announcement'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Form */}
        {showForm && (
          <div className="card mb-8 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">New Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Announcement content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                    <option value="Events">Events</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles (empty = all)</label>
                <div className="flex gap-4">
                  {['STUDENT', 'TEACHER', 'PARENT'].map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.targetRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={e => setForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Pin announcement</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Announcements</h3>
            <p className="text-gray-500">Create your first announcement above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div
                key={a.id}
                className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border transition-all duration-300 ${
                  a.isPinned ? 'border-yellow-300' : 'border-gray-100 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {a.isPinned && <span className="text-yellow-500">📌</span>}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.MEDIUM}`}>
                        {a.priority}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        {a.category}
                      </span>
                      {a.targetRoles.length > 0 && (
                        <span className="text-xs text-gray-400">→ {a.targetRoles.join(', ')}</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{a.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      By {a.author.name} • {new Date(a.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePin(a.id, a.isPinned)}
                      className={`p-2 rounded-lg text-sm transition-colors ${a.isPinned ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      title={a.isPinned ? 'Unpin' : 'Pin'}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
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
