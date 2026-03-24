'use client'

import { useEffect, useState, useCallback } from 'react'

interface Notification {
  id: string
  status: 'PENDING' | 'APPROVED' | 'CORRECTED' | 'FAILED'
  date: string
  student: { id: string; name: string }
  class: { id: string; name: string }
  markedBy: { id: string; name: string }
  reviewedBy?: { id: string; name: string } | null
  reviewedAt?: string | null
  reviewNote?: string | null
  correctedTo?: string | null
  whatsappSent: boolean
  emailSent: boolean
  whatsappError?: string | null
  emailError?: string | null
  attendance: { status: string }
}

interface Summary { pending: number; approved: number; corrected: number; failed: number }

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  APPROVED:  'bg-green-100 text-green-700',
  CORRECTED: 'bg-blue-100 text-blue-700',
  FAILED:    'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING:   '⏳ Bekliyor',
  APPROVED:  '✅ Onaylandı',
  CORRECTED: '✏️ Düzeltildi',
  FAILED:    '❌ Başarısız',
}
const ATTENDANCE_LABEL: Record<string, string> = {
  ABSENT:  'Devamsız',
  LATE:    'Geç Geldi',
  PRESENT: 'Mevcut',
  EXCUSED: 'İzinli',
}

export default function StaffAttendanceReviewPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [summary, setSummary]             = useState<Summary>({ pending: 0, approved: 0, corrected: 0, failed: 0 })
  const [loading, setLoading]             = useState(true)
  const [dateFilter, setDateFilter]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('PENDING')
  const [classFilter, setClassFilter]     = useState('')
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg]           = useState<{ msg: string; ok: boolean } | null>(null)
  const [correctModal, setCorrectModal]   = useState<Notification | null>(null)
  const [correctTo, setCorrectTo]         = useState('PRESENT')
  const [correctNote, setCorrectNote]     = useState('')
  const [submitting, setSubmitting]       = useState(false)

  function showToast(msg: string, ok = true) {
    setToastMsg({ msg, ok })
    setTimeout(() => setToastMsg(null), 3500)
  }

  const fetchData = useCallback(() => {
    const params = new URLSearchParams()
    if (dateFilter)   params.set('date',    dateFilter)
    if (statusFilter) params.set('status',  statusFilter)
    if (classFilter)  params.set('classId', classFilter)

    setLoading(true)
    fetch(`/api/admin/absence-notifications?${params}`)
      .then(r => r.json())
      .then(d => {
        setNotifications(d.notifications ?? [])
        setSummary(d.summary ?? { pending: 0, approved: 0, corrected: 0, failed: 0 })
        setSelected(new Set())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateFilter, statusFilter, classFilter])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleApprove(id: string) {
    setSubmitting(true)
    try {
      const r = await fetch(`/api/admin/absence-notifications/${id}/approve`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast('Bildirim onaylandı ve gönderildi')
      fetchData()
    } finally { setSubmitting(false) }
  }

  async function handleBulkApprove() {
    if (selected.size === 0) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/admin/absence-notifications/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast(`${d.summary.sent} gönderildi, ${d.summary.failed} başarısız`)
      fetchData()
    } finally { setSubmitting(false) }
  }

  async function handleRetry(ids: string[]) {
    setSubmitting(true)
    try {
      const r = await fetch('/api/admin/absence-notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast(`Tekrar denendi: ${d.summary.sent} gönderildi`)
      fetchData()
    } finally { setSubmitting(false) }
  }

  async function handleCorrect() {
    if (!correctModal) return
    setSubmitting(true)
    try {
      const r = await fetch(`/api/admin/absence-notifications/${correctModal.id}/correct`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correctedTo: correctTo, reviewNote: correctNote }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast('Devamsızlık düzeltildi')
      setCorrectModal(null)
      setCorrectNote('')
      fetchData()
    } finally { setSubmitting(false) }
  }

  const allPendingIds   = notifications.filter(n => n.status === 'PENDING').map(n => n.id)
  const allPendingSelected = allPendingIds.length > 0 && allPendingIds.every(id => selected.has(id))

  function toggleAll() {
    if (allPendingSelected) {
      setSelected(prev => { const s = new Set(prev); allPendingIds.forEach(id => s.delete(id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); allPendingIds.forEach(id => s.add(id)); return s })
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Devamsızlık Bildirimleri</h1>
        <p className="text-sm text-gray-500 mt-1">Yoklama bildirimlerini incele, onayla veya düzelt</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Bekleyen',     value: summary.pending,   color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200' },
          { label: 'Onaylanan',    value: summary.approved,  color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'Düzeltilen',   value: summary.corrected, color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200'  },
          { label: 'Başarısız',    value: summary.failed,    color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200'   },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="input-field text-sm"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm">
          <option value="">Tüm Durumlar</option>
          <option value="PENDING">Bekleyen</option>
          <option value="APPROVED">Onaylanan</option>
          <option value="CORRECTED">Düzeltilen</option>
          <option value="FAILED">Başarısız</option>
        </select>
        <button onClick={fetchData} className="btn-secondary text-sm">🔄 Yenile</button>

        {selected.size > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            ✅ {selected.size} bildirimi onayla ve gönder
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">Bildirim bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Öğrenci</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sınıf</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Bildirim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">İşaretleyen</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    {n.status === 'PENDING' && (
                      <input
                        type="checkbox"
                        checked={selected.has(n.id)}
                        onChange={() => toggleOne(n.id)}
                        className="rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{n.student.name}</td>
                  <td className="px-4 py-3 text-gray-500">{n.class.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(n.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[n.status]}`}>
                      {STATUS_LABEL[n.status]}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {ATTENDANCE_LABEL[n.attendance.status] ?? n.attendance.status}
                      {n.correctedTo && (
                        <span className="text-blue-500"> → {ATTENDANCE_LABEL[n.correctedTo] ?? n.correctedTo}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 text-xs">
                      {n.whatsappSent
                        ? <span className="text-green-600" title="WhatsApp gönderildi">📱✅</span>
                        : n.whatsappError
                          ? <span className="text-red-400" title={n.whatsappError}>📱❌</span>
                          : <span className="text-gray-300">📱—</span>
                      }
                      {n.emailSent
                        ? <span className="text-green-600" title="E-posta gönderildi">✉️✅</span>
                        : n.emailError
                          ? <span className="text-red-400" title={n.emailError}>✉️❌</span>
                          : <span className="text-gray-300">✉️—</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{n.markedBy.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {n.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(n.id)}
                            disabled={submitting}
                            className="text-xs text-green-600 hover:text-green-800 font-semibold disabled:opacity-50"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => { setCorrectModal(n); setCorrectTo('PRESENT'); setCorrectNote('') }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                          >
                            Düzelt
                          </button>
                        </>
                      )}
                      {n.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry([n.id])}
                          disabled={submitting}
                          className="text-xs text-orange-500 hover:text-orange-700 font-semibold disabled:opacity-50"
                        >
                          Tekrar Dene
                        </button>
                      )}
                      {n.reviewNote && (
                        <span className="text-xs text-gray-400" title={n.reviewNote}>📝</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Correct modal */}
      {correctModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Devamsızlık Düzelt</h2>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{correctModal.student.name}</strong> —{' '}
              {new Date(correctModal.date).toLocaleDateString('tr-TR')}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Durum</label>
              <select
                value={correctTo}
                onChange={e => setCorrectTo(e.target.value)}
                className="input-field text-sm w-full"
              >
                <option value="PRESENT">Mevcut</option>
                <option value="EXCUSED">İzinli</option>
                <option value="ABSENT">Devamsız</option>
                <option value="LATE">Geç Geldi</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Not (isteğe bağlı)</label>
              <textarea
                value={correctNote}
                onChange={e => setCorrectNote(e.target.value)}
                className="input-field text-sm w-full resize-none"
                rows={2}
                placeholder="Düzeltme sebebi…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCorrectModal(null)} className="btn-secondary text-sm">İptal</button>
              <button
                onClick={handleCorrect}
                disabled={submitting}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submitting ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toastMsg.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  )
}
