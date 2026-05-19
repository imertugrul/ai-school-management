'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Assignment {
  courseId: string
  classId: string
  course: { code: string; name: string }
  class: { name: string }
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']

function ScheduleEditor() {
  const router = useRouter()
  const search = useSearchParams()
  const editingId = search.get('id')
  const isEditing = !!editingId

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [schoolHours, setSchoolHours] = useState<{ start: string; end: string }>({ start: '08:00', end: '17:00' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    courseId: '',
    dayOfWeek: '0',
    startTime: '08:00',
    endTime: '08:45',
    room: '',
  })

  // ── Initial load: assignments + school hours + (if editing) the entry ────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [assignmentsRes, scheduleRes] = await Promise.all([
          fetch('/api/teacher/assignments').then(r => r.json()),
          fetch('/api/teacher/schedule').then(r => r.json()),
        ])
        if (cancelled) return
        if (assignmentsRes.success) setAssignments(assignmentsRes.assignments)
        if (scheduleRes.success && scheduleRes.schoolHours) setSchoolHours(scheduleRes.schoolHours)

        if (editingId) {
          const r = await fetch(`/api/teacher/schedule/${editingId}`)
          const data = await r.json()
          if (cancelled) return
          if (data.success) {
            setForm({
              courseId: data.schedule.course.id,
              dayOfWeek: String(data.schedule.dayOfWeek),
              startTime: data.schedule.startTime,
              endTime: data.schedule.endTime,
              room: data.schedule.room ?? '',
            })
          } else {
            setError(data.error || 'Schedule yüklenemedi.')
          }
        }
      } catch {
        if (!cancelled) setError('Veri yüklenirken hata oluştu.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [editingId])

  // ── Inline validation ────────────────────────────────────────────────────
  const isStartBeforeEnd = form.startTime < form.endTime
  const isOutsideSchoolHours =
    form.startTime < schoolHours.start || form.endTime > schoolHours.end
  const validationWarning = !isStartBeforeEnd
    ? 'Bitiş saati başlangıç saatinden sonra olmalı.'
    : isOutsideSchoolHours
    ? `⚠️ Okul ders saatleri: ${schoolHours.start} – ${schoolHours.end}`
    : ''

  const canSubmit = form.courseId && isStartBeforeEnd && !isOutsideSchoolHours

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.courseId) { setError('Lütfen bir ders seçin.'); return }

    setSaving(true)
    try {
      const url = isEditing
        ? `/api/teacher/schedule/${editingId}`
        : '/api/teacher/schedule/add'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: form.courseId,
          dayOfWeek: parseInt(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/teacher/schedule')
      } else {
        setError(data.error || (isEditing ? 'Güncellenemedi.' : 'Eklenemedi.'))
      }
    } catch {
      setError('Bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {isEditing ? 'Ders Düzenle' : 'Yeni Ders Ekle'}
            </h1>
            <button onClick={() => router.push('/teacher/schedule')} className="btn-secondary">
              ← Geri
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-700 font-medium mb-2">Atanmış dersiniz yok.</p>
            <p className="text-gray-400 text-sm">Önce yöneticiden size ders ataması yapmasını isteyin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
              ⏰ Okul ders saatleri: <strong>{schoolHours.start} – {schoolHours.end}</strong>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ders & Sınıf *
              </label>
              <select
                className="input-field"
                value={form.courseId}
                onChange={e => setForm({ ...form, courseId: e.target.value })}
                required
              >
                <option value="">Ders seçin...</option>
                {assignments.map(a => (
                  <option key={`${a.courseId}-${a.classId}`} value={a.courseId}>
                    {a.course.code} – {a.course.name} ({a.class.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gün *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Saati *</label>
                <input
                  type="time"
                  className={`input-field ${(!isStartBeforeEnd || isOutsideSchoolHours) ? 'border-amber-400' : ''}`}
                  value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  min={schoolHours.start}
                  max={schoolHours.end}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Saati *</label>
                <input
                  type="time"
                  className={`input-field ${(!isStartBeforeEnd || isOutsideSchoolHours) ? 'border-amber-400' : ''}`}
                  value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  min={schoolHours.start}
                  max={schoolHours.end}
                  required
                />
              </div>
            </div>

            {validationWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl">
                {validationWarning}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sınıf (Oda) <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="ör. A101"
                value={form.room}
                onChange={e => setForm({ ...form, room: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? (isEditing ? 'Güncelleniyor…' : 'Ekleniyor…')
                : (isEditing ? '💾 Güncelle' : '+ Programa Ekle')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ScheduleEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ScheduleEditor />
    </Suspense>
  )
}
