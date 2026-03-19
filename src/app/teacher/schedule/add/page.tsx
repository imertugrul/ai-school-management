'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Assignment {
  courseId: string
  classId: string
  course: { code: string; name: string }
  class: { name: string }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function AddScheduleEntryPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    courseId: '',
    dayOfWeek: '0',
    startTime: '08:00',
    endTime: '08:45',
    room: ''
  })

  useEffect(() => {
    fetch('/api/teacher/assignments')
      .then(r => r.json())
      .then(data => {
        if (data.success) setAssignments(data.assignments)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.courseId) {
      setError('Please select a course.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/teacher/schedule/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: form.courseId,
          dayOfWeek: parseInt(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room || null
        })
      })

      const data = await res.json()

      if (data.success) {
        router.push('/teacher/schedule')
      } else {
        setError(data.error || 'Failed to add entry.')
      }
    } catch (err) {
      setError('An error occurred.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Add Schedule Entry</h1>
            <button onClick={() => router.push('/teacher/schedule')} className="btn-secondary">
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-700 font-medium mb-2">No course assignments found.</p>
            <p className="text-gray-400 text-sm">Ask your admin to assign courses to you first.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course & Class *
              </label>
              <select
                className="input-field"
                value={form.courseId}
                onChange={e => setForm({ ...form, courseId: e.target.value })}
                required
              >
                <option value="">Select a course...</option>
                {assignments.map(a => (
                  <option key={`${a.courseId}-${a.classId}`} value={a.courseId}>
                    {a.course.code} – {a.course.name} ({a.class.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day *</label>
              <select
                className="input-field"
                value={form.dayOfWeek}
                onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room (optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. A101"
                value={form.room}
                onChange={e => setForm({ ...form, room: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add to Schedule'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
