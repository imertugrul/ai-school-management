'use client'

import { useEffect, useState } from 'react'

interface Appointment {
  id: string
  studentName: string
  subject: string
  message: string
  preferredTime?: string
  preferredDate?: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  response?: string
  createdAt: string
  parent: { name: string; email: string }
  assignee?: { name: string }
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Bekliyor',   color: 'bg-amber-100 text-amber-700',  icon: '⏳' },
  CONFIRMED: { label: 'Onaylandı',  color: 'bg-green-100 text-green-700',  icon: '✅' },
  REJECTED:  { label: 'Reddedildi', color: 'bg-red-100 text-red-700',      icon: '❌' },
}

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('PENDING')
  const [responding, setResponding]     = useState<string | null>(null)
  const [response, setResponse]         = useState('')

  async function load() {
    setLoading(true)
    fetch('/api/staff/appointments')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setAppointments(d) : [])
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleAction(id: string, status: 'CONFIRMED' | 'REJECTED') {
    await fetch(`/api/staff/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, response: response.trim() || undefined }),
    })
    setResponding(null)
    setResponse('')
    load()
  }

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter)
  const pendingCount = appointments.filter(a => a.status === 'PENDING').length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Randevu Talepleri</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{pendingCount}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Veli randevu taleplerini incele ve yanıtla</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['PENDING', 'CONFIRMED', 'REJECTED', 'ALL'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'Tümü' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
            {s === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">Bu kategoride randevu talebi bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(appt => {
            const cfg = STATUS_CONFIG[appt.status]
            return (
              <div key={appt.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{appt.parent.name}</p>
                        <span className="text-gray-400 text-sm">—</span>
                        <p className="text-gray-700 text-sm font-medium">{appt.studentName}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-700 mt-1">{appt.subject}</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{appt.message}</p>
                      {appt.preferredTime && (
                        <p className="text-xs text-gray-500 mt-2">
                          🕐 Tercih edilen zaman: <span className="font-medium">{appt.preferredTime}</span>
                        </p>
                      )}
                      {appt.preferredDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          📅 Tarih: {new Date(appt.preferredDate).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                      {appt.response && (
                        <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Yanıt: </span>{appt.response}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(appt.createdAt).toLocaleString('tr-TR')}
                        {appt.assignee && ` — ${appt.assignee.name} tarafından yanıtlandı`}
                      </p>
                    </div>
                  </div>

                  {/* Reply input (when responding) */}
                  {responding === appt.id && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        rows={2}
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        placeholder="Veliye gönderilecek yanıt (opsiyonel)..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(appt.id, 'CONFIRMED')}
                          className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                        >
                          ✅ Onayla
                        </button>
                        <button
                          onClick={() => handleAction(appt.id, 'REJECTED')}
                          className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
                        >
                          ❌ Reddet
                        </button>
                        <button
                          onClick={() => { setResponding(null); setResponse('') }}
                          className="py-2 px-4 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {appt.status === 'PENDING' && responding !== appt.id && (
                  <div className="px-5 pb-4 flex gap-2">
                    <button
                      onClick={() => setResponding(appt.id)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Yanıtla
                    </button>
                    <a
                      href={`mailto:${appt.parent.email}`}
                      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      E-posta Gönder
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
