'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  organizer: { id: string; name: string }
}

export default function StaffEventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', location: '' })

  const userId = (session?.user as any)?.id

  const fetchEvents = () => {
    setLoading(true)
    fetch('/api/events')
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEvents() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, endDate: form.endDate || null, location: form.location || null }),
      })
      if (r.ok) {
        setForm({ title: '', description: '', startDate: '', endDate: '', location: '' })
        setShowForm(false)
        fetchEvents()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteOne(id: string) {
    if (!confirm('Bu etkinliği silmek istiyor musunuz?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  const upcoming = events.filter(e => new Date(e.startDate) >= new Date())
  const past     = events.filter(e => new Date(e.startDate) < new Date())

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
          <p className="text-sm text-gray-500 mt-1">Okul etkinliklerini yönet</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm">
          {showForm ? 'İptal' : '+ Yeni Etkinlik'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Yeni Etkinlik</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input-field text-sm w-full" placeholder="Etkinlik adı…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field text-sm w-full" placeholder="Etkinlik detayları…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç *</label>
              <input required type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input-field text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="input-field text-sm w-full" placeholder="Konferans salonu, spor alanı…" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">İptal</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Kaydediliyor…' : 'Oluştur'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Yaklaşan</h2>
              <div className="space-y-3">
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} userId={userId} onDelete={deleteOne} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Geçmiş</h2>
              <div className="space-y-3 opacity-60">
                {past.slice(0, 10).map(e => (
                  <EventCard key={e.id} event={e} userId={userId} onDelete={deleteOne} />
                ))}
              </div>
            </div>
          )}
          {events.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-gray-500">Etkinlik bulunamadı.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, userId, onDelete }: { event: Event; userId: string; onDelete: (id: string) => void }) {
  const d = new Date(event.startDate)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className="w-14 h-14 bg-rose-50 rounded-xl flex flex-col items-center justify-center shrink-0">
        <span className="text-lg font-bold text-rose-600">{d.getDate()}</span>
        <span className="text-xs text-rose-400">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{event.title}</h3>
        {event.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{event.description}</p>}
        <div className="flex gap-3 mt-1 text-xs text-gray-400">
          {event.location && <span>📍 {event.location}</span>}
          <span>🕐 {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>👤 {event.organizer.name}</span>
        </div>
      </div>
      {event.organizer.id === userId && (
        <button onClick={() => onDelete(event.id)} className="text-gray-300 hover:text-red-500 transition-colors text-xl shrink-0">×</button>
      )}
    </div>
  )
}
