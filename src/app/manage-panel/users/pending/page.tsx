'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  createdAt: string
}

interface Counts { pending: number; active: number; suspended: number }

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800',
  ACTIVE:    'bg-emerald-100 text-emerald-800',
  SUSPENDED: 'bg-red-100 text-red-800',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor', ACTIVE: 'Aktif', SUSPENDED: 'Askıda',
}
const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Öğrenci', TEACHER: 'Öğretmen', ADMIN: 'Admin',
  PARENT: 'Veli', SOCIAL_MEDIA_MANAGER: 'SM Yöneticisi',
  VICE_PRINCIPAL: 'Müdür Yrd.', COUNSELOR: 'Danışman', SECRETARY: 'Sekreter',
}

function timeSince(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return `${secs}s önce`
  if (secs < 3600) return `${Math.floor(secs / 60)}dk önce`
  if (secs < 86400) return `${Math.floor(secs / 3600)}sa önce`
  return `${Math.floor(secs / 86400)}g önce`
}

export default function UserApprovalsPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [counts, setCounts] = useState<Counts>({ pending: 0, active: 0, suspended: 0 })
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/pending?status=${filter}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setCounts(data.counts)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    setSelected(new Set())
    fetchUsers()
  }, [fetchUsers])

  const updateStatus = async (id: string, status: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== id))
        setCounts(prev => {
          const old = users.find(u => u.id === id)?.status
          const next = { ...prev }
          if (old === 'PENDING') next.pending--
          if (old === 'ACTIVE') next.active--
          if (old === 'SUSPENDED') next.suspended--
          if (status === 'PENDING') next.pending++
          if (status === 'ACTIVE') next.active++
          if (status === 'SUSPENDED') next.suspended++
          return next
        })
        showToast(
          status === 'ACTIVE' ? '✅ Kullanıcı onaylandı'
          : status === 'SUSPENDED' ? '🚫 Kullanıcı askıya alındı'
          : '⏳ Durum güncellendi'
        )
      } else {
        showToast('❌ Hata: ' + data.error, false)
      }
    } finally { setActing(null) }
  }

  const bulkApprove = async () => {
    if (selected.size === 0) return
    const ids = [...selected]
    try {
      const res = await fetch('/api/admin/users/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'ACTIVE' }),
      })
      const data = await res.json()
      if (data.success) {
        setUsers(prev => prev.filter(u => !selected.has(u.id)))
        setCounts(prev => ({ ...prev, pending: Math.max(0, prev.pending - data.count), active: prev.active + data.count }))
        setSelected(new Set())
        showToast(`✅ ${data.count} kullanıcı onaylandı`)
      }
    } catch { showToast('❌ Hata', false) }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set())
    else setSelected(new Set(users.map(u => u.id)))
  }

  const filtered = users

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-bold text-gray-900">👥 Kullanıcı Onayları</h1>
              {counts.pending > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {counts.pending} bekliyor
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/manage-panel')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ← Panel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Onay Bekliyor', value: counts.pending, cls: 'text-amber-600', filter: 'PENDING' as const },
            { label: 'Aktif',         value: counts.active,  cls: 'text-emerald-600', filter: 'ACTIVE' as const },
            { label: 'Askıda',        value: counts.suspended, cls: 'text-red-600',   filter: 'SUSPENDED' as const },
          ].map(s => (
            <button
              key={s.filter}
              onClick={() => setFilter(s.filter)}
              className={`bg-white rounded-2xl border shadow-sm p-4 text-center transition-all hover:shadow-md ${
                filter === s.filter ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100'
              }`}
            >
              <p className={`text-3xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'ALL' ? 'Tümü' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-blue-800">{selected.size} kullanıcı seçildi</span>
            <button
              onClick={bulkApprove}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              ✅ Toplu Onayla
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              İptal
            </button>
          </div>
        )}

        {/* User list */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-gray-500 font-medium">
              {filter === 'PENDING' ? 'Onay bekleyen kullanıcı yok.' : 'Bu filtrede kullanıcı bulunamadı.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm font-semibold text-gray-700">
                {filtered.length} kullanıcı
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(user => (
                <div key={user.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                  user.status === 'PENDING' ? 'bg-amber-50/30' : ''
                }`}>
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="w-4 h-4 rounded accent-blue-600 shrink-0"
                  />

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{user.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[user.status]}`}>
                        {STATUS_LABEL[user.status]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {user.email} · {timeSince(user.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {user.status !== 'ACTIVE' && (
                      <button
                        onClick={() => updateStatus(user.id, 'ACTIVE')}
                        disabled={acting === user.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        ✅ Onayla
                      </button>
                    )}
                    {user.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => updateStatus(user.id, 'SUSPENDED')}
                        disabled={acting === user.id}
                        className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        🚫 Reddet
                      </button>
                    )}
                    {user.status === 'SUSPENDED' && (
                      <button
                        onClick={() => updateStatus(user.id, 'ACTIVE')}
                        disabled={acting === user.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        🔓 Aktif Et
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
