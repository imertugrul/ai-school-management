'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  category: string
  isPinned: boolean
  publishedAt: string
  author: { id: string; name: string; role: string }
  targetRoles: string[]
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH:   'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  LOW:    'bg-gray-100 text-gray-600',
}

// Staff cannot target ADMIN role
const ALLOWED_TARGET_ROLES = ['TEACHER', 'STUDENT', 'PARENT', 'VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY']

export default function StaffAnnouncementsPage() {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', content: '', priority: 'MEDIUM', category: 'General',
    targetRoles: [] as string[], isPinned: false, expiresAt: '',
  })

  const userId = (session?.user as any)?.id

  const fetchAnnouncements = () => {
    setLoading(true)
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => { if (d.success) setAnnouncements(d.announcements) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAnnouncements() }, [])

  function toggleRole(role: string) {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
      })
      if (r.ok) {
        setForm({ title: '', content: '', priority: 'MEDIUM', category: 'General', targetRoles: [], isPinned: false, expiresAt: '' })
        setShowForm(false)
        fetchAnnouncements()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteOne(id: string) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    fetchAnnouncements()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="text-sm text-gray-500 mt-1">Okul duyurularını görüntüle ve yönet</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm">
          {showForm ? 'İptal' : '+ Yeni Duyuru'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Yeni Duyuru</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input-field text-sm w-full" placeholder="Duyuru başlığı…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İçerik *</label>
            <textarea required rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="input-field text-sm w-full" placeholder="Duyuru içeriği…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field text-sm w-full">
                <option value="LOW">Düşük</option>
                <option value="MEDIUM">Orta</option>
                <option value="HIGH">Yüksek</option>
                <option value="URGENT">Acil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="input-field text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Gruplar</label>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_TARGET_ROLES.map(role => (
                <button key={role} type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.targetRoles.includes(role) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="isPinned" className="text-sm text-gray-700">Sabit duyuru olarak işaretle</label>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">İptal</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Kaydediliyor…' : 'Yayınla'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📢</div>
          <p className="text-gray-500">Duyuru bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {a.isPinned && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">📌 Sabit</span>}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.MEDIUM}`}>{a.priority}</span>
                    <span className="text-xs text-gray-400">{a.category}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {a.author.name} · {new Date(a.publishedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                {/* Only delete own announcements */}
                {a.author.id === userId && (
                  <button onClick={() => deleteOne(a.id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg shrink-0">×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
