'use client'

import { useEffect, useState, useCallback } from 'react'

type NotifStatus = 'PENDING' | 'APPROVED' | 'CORRECTED' | 'SENT' | 'FAILED'

interface Guardian {
  name: string
  email: string | null
  phone: string | null
  receivesEmail: boolean
  receivesSMS: boolean
}

interface Notification {
  id: string
  status: NotifStatus
  date: string
  whatsappSent: boolean
  emailSent: boolean
  whatsappError: string | null
  emailError: string | null
  originalStatus: string | null
  correctedTo: string | null
  reviewNote: string | null
  reviewedAt: string | null
  student: { id: string; name: string; guardians: Guardian[] }
  class: { id: string; name: string }
  attendance: { status: string; notes: string | null }
  markedBy: { id: string; name: string }
  reviewedBy: { id: string; name: string } | null
}

interface Summary {
  pending: number
  approvedToday: number
  corrected: number
  sent: number
}

interface ClassItem {
  id: string
  name: string
  _count: { students: number }
}

const STATUS_MAP: Record<NotifStatus, { label: string; cls: string; icon: string }> = {
  PENDING:   { label: 'Bekliyor',    cls: 'bg-amber-100 text-amber-700',   icon: '⏳' },
  APPROVED:  { label: 'Onaylandı',  cls: 'bg-blue-100 text-blue-700',     icon: '✅' },
  CORRECTED: { label: 'Düzeltildi', cls: 'bg-purple-100 text-purple-700', icon: '✏️' },
  SENT:      { label: 'Gönderildi', cls: 'bg-green-100 text-green-700',   icon: '📨' },
  FAILED:    { label: 'Başarısız',  cls: 'bg-red-100 text-red-700',       icon: '❌' },
}

const ATTEND_MAP: Record<string, { label: string; icon: string; cls: string }> = {
  ABSENT:  { label: 'Devamsız',   icon: '🔴', cls: 'text-red-600 font-semibold'    },
  LATE:    { label: 'Geç',        icon: '🟡', cls: 'text-amber-600 font-semibold'  },
  PRESENT: { label: 'Mevcut',    icon: '🟢', cls: 'text-green-600'                 },
  EXCUSED: { label: 'Mazeretli', icon: '🔵', cls: 'text-blue-600'                  },
}

export default function AttendanceReviewPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [summary, setSummary]   = useState<Summary>({ pending: 0, approvedToday: 0, corrected: 0, sent: 0 })
  const [classes, setClasses]   = useState<ClassItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [classId, setClassId] = useState('')
  const [statusF, setStatusF] = useState('PENDING')

  const [correctModal, setCorrectModal] = useState<Notification | null>(null)
  const [correctTo,    setCorrectTo]    = useState('PRESENT')
  const [reviewNote,   setReviewNote]   = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (date)    params.set('date', date)
      if (classId) params.set('classId', classId)
      if (statusF && statusF !== 'ALL') params.set('status', statusF)
      const r = await fetch(`/api/admin/attendance-review?${params}`)
      const d = await r.json()
      setNotifications(d.notifications ?? [])
      setSummary(d.summary ?? { pending: 0, approvedToday: 0, corrected: 0, sent: 0 })
    } finally {
      setLoading(false)
    }
  }, [date, classId, statusF])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    fetch('/api/teacher/classes').then(r => r.json()).then(d => setClasses(d.classes ?? [])).catch(() => {})
  }, [])

  async function approveOne(id: string) {
    setActionLoading(id)
    try {
      const r = await fetch(`/api/admin/attendance-review/${id}/approve`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast('Onaylandı, bildirim gönderiliyor')
      fetchData()
    } finally { setActionLoading(null) }
  }

  async function approveSelected() {
    if (selected.size === 0) return
    setActionLoading('bulk')
    try {
      const r = await fetch('/api/admin/attendance-review/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast(`${d.approved} bildirim onaylandı`)
      setSelected(new Set())
      fetchData()
    } finally { setActionLoading(null) }
  }

  async function approveAll() {
    setActionLoading('all')
    try {
      const r = await fetch('/api/admin/attendance-review/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveAll: true, date }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast(d.message ?? `${d.approved} bildirim onaylandı`)
      setSelected(new Set())
      fetchData()
    } finally { setActionLoading(null) }
  }

  async function submitCorrection() {
    if (!correctModal) return
    setActionLoading('correct')
    try {
      const r = await fetch(`/api/admin/attendance-review/${correctModal.id}/correct`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctedTo: correctTo, reviewNote }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast('Yoklama düzeltildi')
      setCorrectModal(null)
      fetchData()
    } finally { setActionLoading(null) }
  }

  async function retryOne(id: string) {
    setActionLoading(id + '_retry')
    try {
      const r = await fetch('/api/admin/attendance-review/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast('Tekrar gönderme başlatıldı')
      fetchData()
    } finally { setActionLoading(null) }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const pendingItems = notifications.filter(n => n.status === 'PENDING')

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '⏳', label: 'Onay Bekleyen',    value: summary.pending,       cls: 'border-amber-300 bg-amber-50'   },
          { icon: '✅', label: 'Bugün Onaylanan',  value: summary.approvedToday, cls: 'border-blue-200 bg-blue-50'    },
          { icon: '✏️', label: 'Düzeltilen',       value: summary.corrected,     cls: 'border-purple-200 bg-purple-50' },
          { icon: '📨', label: 'Bugün Gönderilen', value: summary.sent,          cls: 'border-green-200 bg-green-50'  },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.cls}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sınıf</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="input-field text-sm">
            <option value="">Tüm Sınıflar</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="input-field text-sm">
            <option value="ALL">Tümü</option>
            <option value="PENDING">Bekleyenler</option>
            <option value="APPROVED">Onaylananlar</option>
            <option value="CORRECTED">Düzeltilenler</option>
            <option value="SENT">Gönderilenler</option>
            <option value="FAILED">Başarısızlar</option>
          </select>
        </div>
        <button onClick={fetchData} className="btn-secondary text-sm">Yenile</button>
      </div>

      {/* Bulk actions */}
      {pendingItems.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === pendingItems.length}
              onChange={() => selected.size === pendingItems.length ? setSelected(new Set()) : setSelected(new Set(pendingItems.map(n => n.id)))}
              className="w-4 h-4 rounded"
            />
            Tümünü seç ({pendingItems.length})
          </label>
          {selected.size > 0 && (
            <button onClick={approveSelected} disabled={!!actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              ✅ Seçilenleri Onayla ({selected.size})
            </button>
          )}
          <button onClick={approveAll} disabled={!!actionLoading}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
            {actionLoading === 'all' ? 'İşleniyor…' : `✅ Tümünü Onayla (${pendingItems.length})`}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-500">Bu filtre için bildirim bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Öğrenci / Sınıf</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Durum</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tarih</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Öğretmen</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Veli</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Bildirim</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n, i) => {
                  const att = ATTEND_MAP[n.attendance.status] ?? ATTEND_MAP['ABSENT']
                  const s   = STATUS_MAP[n.status]
                  const dateStr = new Date(n.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  return (
                    <tr key={n.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3">
                        {n.status === 'PENDING' && (
                          <input type="checkbox" checked={selected.has(n.id)} onChange={() => toggleSelect(n.id)} className="w-4 h-4 rounded" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{n.student.name}</div>
                        <div className="text-xs text-gray-400">{n.class.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={att.cls}>{att.icon} {att.label}</span>
                        {n.status === 'CORRECTED' && n.correctedTo && (
                          <div className="text-xs text-purple-600 mt-0.5">→ {ATTEND_MAP[n.correctedTo]?.label ?? n.correctedTo}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{dateStr}</td>
                      <td className="px-4 py-3 text-gray-600">{n.markedBy.name}</td>
                      <td className="px-4 py-3">
                        {n.student.guardians.length === 0 ? (
                          <span className="text-amber-600 text-xs font-medium">⚠️ Veli yok</span>
                        ) : (
                          <div className="space-y-0.5">
                            {n.student.guardians.slice(0, 2).map((g, gi) => (
                              <div key={gi} className="text-xs text-gray-600">
                                {g.name}
                                {g.receivesEmail && g.email && <span className="ml-1 text-green-600">📧</span>}
                                {g.receivesSMS && g.phone && <span className="ml-1 text-green-600">📱</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
                          {s.icon} {s.label}
                        </span>
                        {n.status === 'FAILED' && (
                          <div className="text-xs text-red-500 mt-0.5">{n.emailError ?? n.whatsappError}</div>
                        )}
                        {n.status === 'CORRECTED' && n.reviewNote && (
                          <div className="text-xs text-purple-600 mt-0.5 italic">"{n.reviewNote}"</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {n.status === 'PENDING' && (
                            <>
                              <button onClick={() => approveOne(n.id)} disabled={actionLoading === n.id}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                {actionLoading === n.id ? '…' : '✅ Onayla'}
                              </button>
                              <button onClick={() => { setCorrectModal(n); setCorrectTo('PRESENT'); setReviewNote('') }}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                ✏️ Düzelt
                              </button>
                            </>
                          )}
                          {n.status === 'FAILED' && (
                            <button onClick={() => retryOne(n.id)} disabled={actionLoading === n.id + '_retry'}
                              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              🔄 Tekrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Yoklama Düzeltme</h2>
              <p className="text-sm text-gray-500 mt-0.5">{correctModal.student.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <span className="text-gray-500">Mevcut durum: </span>
                <span className={ATTEND_MAP[correctModal.attendance.status]?.cls ?? ''}>
                  {ATTEND_MAP[correctModal.attendance.status]?.icon} {ATTEND_MAP[correctModal.attendance.status]?.label ?? correctModal.attendance.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Düzelt:</label>
                <div className="space-y-2">
                  {[
                    { value: 'PRESENT', label: '🟢 Mevcut (Present)' },
                    { value: 'LATE',    label: '🟡 Geç (Late)'       },
                    { value: 'EXCUSED', label: '🔵 Mazeretli (Excused)' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                      <input type="radio" name="correctedTo" value={opt.value}
                        checked={correctTo === opt.value} onChange={e => setCorrectTo(e.target.value)} className="w-4 h-4" />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Müdür Notu (opsiyonel)</label>
                <textarea rows={3} className="input-field text-sm w-full"
                  placeholder="Veli aradı, hastalık mazeret belgesi gelecek…"
                  value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setCorrectModal(null)} className="btn-secondary text-sm">İptal</button>
              <button onClick={submitCorrection} disabled={actionLoading === 'correct'}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                {actionLoading === 'correct' ? 'Kaydediliyor…' : 'Düzeltmeyi Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
