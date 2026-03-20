'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string
  endDate: string
  isAllDay: boolean
  category: string
  color: string | null
  organizer: { name: string }
}

const CATEGORIES = ['General', 'Academic', 'Sports', 'Cultural', 'Holiday']
const CATEGORY_COLORS: Record<string, string> = {
  General: 'bg-gray-100 text-gray-700',
  Academic: 'bg-blue-100 text-blue-700',
  Sports: 'bg-green-100 text-green-700',
  Cultural: 'bg-purple-100 text-purple-700',
  Holiday: 'bg-orange-100 text-orange-700',
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', location: '',
    startDate: '', endDate: '', isAllDay: false,
    category: 'General', color: '#3b82f6'
  })

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    setLoading(true)
    const res = await fetch('/api/events')
    const data = await res.json()
    if (data.success) setEvents(data.events)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      setError('Title, start date, and end date are required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setShowForm(false)
      setForm({ title: '', description: '', location: '', startDate: '', endDate: '', isAllDay: false, category: 'General', color: '#3b82f6' })
      fetchEvents()
    } else {
      setError(data.error || 'Failed to save')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🗓️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Events</h1>
                <p className="text-xs text-gray-500">School calendar management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Event</button>
              <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {showForm && (
          <div className="card mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">New Event</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                <input type="datetime-local" className="input-field" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                <input type="datetime-local" className="input-field" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Gymnasium, Room 201" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                <input type="color" className="input-field h-10 cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="allday" checked={form.isAllDay} onChange={e => setForm(f => ({ ...f, isAllDay: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="allday" className="text-sm font-semibold text-gray-700">All Day Event</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea className="input-field min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event details..." />
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Create Event'}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🗓️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create the first school event</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ New Event</button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: event.color || '#3b82f6' }} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[event.category] || 'bg-gray-100 text-gray-700'}`}>
                          {event.category}
                        </span>
                        {event.isAllDay && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">All Day</span>}
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.startDate)} → {formatDate(event.endDate)}
                      </p>
                      {event.location && <p className="text-xs text-gray-400 mt-0.5">📍 {event.location}</p>}
                      {event.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="shrink-0 text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    Delete
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
