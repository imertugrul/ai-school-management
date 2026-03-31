'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type TestStatus = 'DRAFT' | 'ASSIGNED' | 'ACTIVE' | 'COMPLETED'

interface Test {
  id: string
  title: string
  subject: string | null
  description: string | null
  createdAt: string
  status: TestStatus
  isActive: boolean
  startDate: string | null
  endDate: string | null
  startedAt: string | null
  endedAt: string | null
  accessCode: string
  questions: any[]
  _count: {
    submissions: number
    testAssignments: number
  }
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({ endDate }: { endDate: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!endDate) return
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) { setExpired(true); setTimeLeft(null); return }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endDate])

  if (!endDate) {
    return <span className="text-sm text-gray-400 italic">Süresiz</span>
  }
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-bold animate-pulse">
        ⏱ Süre Doldu
      </span>
    )
  }
  if (!timeLeft) return null

  const totalMins = timeLeft.h * 60 + timeLeft.m
  const colorCls =
    totalMins > 30
      ? 'bg-green-100 text-green-700'
      : totalMins > 10
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700 animate-pulse'

  const fmt = (n: number) => String(n).padStart(2, '0')
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ${colorCls}`}>
      ⏱ Kalan: {fmt(timeLeft.h)}:{fmt(timeLeft.m)}:{fmt(timeLeft.s)}
    </span>
  )
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────
interface ModalProps {
  title: string
  children: React.ReactNode
  confirmLabel: string
  confirmCls?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}
function ConfirmModal({ title, children, confirmLabel, confirmCls, onConfirm, onCancel, loading }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
        <div className="text-sm text-gray-600 mb-6 space-y-2">{children}</div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${confirmCls ?? 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'İşleniyor...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TestStatus }) {
  const map: Record<TestStatus, { label: string; cls: string; dot: string }> = {
    DRAFT:     { label: 'Taslak',      cls: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
    ASSIGNED:  { label: 'Atandı',      cls: 'bg-blue-100 text-blue-800',        dot: 'bg-blue-500' },
    ACTIVE:    { label: 'Aktif',        cls: 'bg-emerald-100 text-emerald-800',  dot: 'bg-emerald-500 animate-pulse' },
    COMPLETED: { label: 'Tamamlandı',  cls: 'bg-gray-200 text-gray-700',        dot: 'bg-gray-500' },
  }
  const { label, cls, dot } = map[status] ?? map.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TestsListPage() {
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [activateModal, setActivateModal] = useState<Test | null>(null)
  const [stopModal, setStopModal] = useState<Test | null>(null)
  const [deleteModal, setDeleteModal] = useState<Test | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const fetchTests = useCallback(async () => {
    try {
      const res = await fetch('/api/tests')
      const data = await res.json()
      if (data.success) setTests(data.tests)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTests() }, [fetchTests])

  const patchTest = (id: string, body: object) =>
    fetch(`/api/tests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())

  const handleActivate = async () => {
    if (!activateModal) return
    setActionLoading(true)
    try {
      await patchTest(activateModal.id, { status: 'ACTIVE', startedAt: new Date().toISOString() })
      showToast('Test başlatıldı! 🚀')
      setActivateModal(null)
      await fetchTests()
    } finally {
      setActionLoading(false)
    }
  }

  const handleStop = async () => {
    if (!stopModal) return
    setActionLoading(true)
    try {
      await patchTest(stopModal.id, { status: 'COMPLETED', endedAt: new Date().toISOString() })
      showToast('Test durduruldu.')
      setStopModal(null)
      await fetchTests()
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setActionLoading(true)
    try {
      await fetch(`/api/tests/${deleteModal.id}`, { method: 'DELETE' })
      showToast('Test silindi.')
      setDeleteModal(null)
      await fetchTests()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Activate Modal */}
      {activateModal && (
        <ConfirmModal
          title="🚀 Testi Başlat"
          confirmLabel="✅ Testi Başlat"
          confirmCls="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={handleActivate}
          onCancel={() => setActivateModal(null)}
          loading={actionLoading}
        >
          <p>
            <strong>"{activateModal.title}"</strong> testini şimdi başlatmak istiyor musunuz?
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-500 mt-2">
            <li>Sorular düzenlenemez</li>
            <li>Öğrenciler teste erişebilir</li>
            {activateModal.endDate && <li>Süre başlar</li>}
          </ul>
        </ConfirmModal>
      )}

      {/* Stop Modal */}
      {stopModal && (
        <ConfirmModal
          title="⏹ Testi Durdur"
          confirmLabel="⏹ Durdur"
          confirmCls="bg-red-600 hover:bg-red-700"
          onConfirm={handleStop}
          onCancel={() => setStopModal(null)}
          loading={actionLoading}
        >
          <p>Testi durdurmak istiyor musunuz?</p>
          <p className="text-gray-500">Henüz teslim etmemiş öğrencilerin cevapları kaydedilecek.</p>
        </ConfirmModal>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <ConfirmModal
          title="🗑️ Testi Sil"
          confirmLabel="Sil"
          confirmCls="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(null)}
          loading={actionLoading}
        >
          <p>
            <strong>"{deleteModal.title}"</strong> testini kalıcı olarak silmek istiyor musunuz?
          </p>
          <p className="text-gray-500">Bu işlem geri alınamaz.</p>
        </ConfirmModal>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Tests</h1>
                <p className="text-xs text-gray-500">{tests.length} test</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/teacher/tests/create')}
                className="btn-primary"
              >
                + Yeni Test
              </button>
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {tests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz test yok</h3>
            <p className="text-gray-500 text-sm mb-6">İlk testini oluştur ve öğrencilerine ata</p>
            <button
              onClick={() => router.push('/teacher/tests/create')}
              className="btn-primary"
            >
              İlk Testini Oluştur
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {tests.map((test) => {
              const status: TestStatus = (test.status as TestStatus) || (test.isActive ? 'ACTIVE' : 'DRAFT')
              const total = test._count.testAssignments
              const submitted = test._count.submissions
              const progressPct = total > 0 ? Math.round((submitted / total) * 100) : 0

              return (
                <div
                  key={test.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-shadow hover:shadow-md ${
                    status === 'ACTIVE' ? 'border-emerald-200' : 'border-gray-200'
                  }`}
                >
                  {/* Card header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{test.title}</h3>
                          <StatusBadge status={status} />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                          {test.subject && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {test.subject}
                            </span>
                          )}
                          <span>📝 {test.questions.length} soru</span>
                          {total > 0 && (
                            <span>👥 {total} öğrenci atandı</span>
                          )}
                          <span className="text-gray-400">
                            {new Date(test.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {test.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{test.description}</p>
                    )}

                    {/* Countdown — only for ACTIVE tests */}
                    {status === 'ACTIVE' && (
                      <div className="flex items-center gap-3 mb-3">
                        <CountdownTimer endDate={test.endDate} />
                      </div>
                    )}

                    {/* Progress bar — ACTIVE or COMPLETED */}
                    {(status === 'ACTIVE' || status === 'COMPLETED') && total > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>👥 {submitted}/{total} öğrenci teslim etti</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              status === 'COMPLETED' ? 'bg-gray-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Access code */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500 font-medium">Kod:</span>
                        <code className="ml-2 text-base font-bold text-blue-600 tracking-wider">{test.accessCode}</code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(test.accessCode)
                          showToast('Kod kopyalandı!')
                        }}
                        className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      >
                        Kopyala
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/join/${test.accessCode}`)
                          showToast('Link kopyalandı!')
                        }}
                        className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      >
                        Link
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    {status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}/edit`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          📋 Assign Et
                        </button>
                        <button
                          onClick={() => setDeleteModal(test)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors ml-auto"
                        >
                          🗑️ Sil
                        </button>
                      </>
                    )}

                    {status === 'ASSIGNED' && (
                      <>
                        <button
                          onClick={() => setActivateModal(test)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          ▶ Activate
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}/edit`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"
                        >
                          📋 Assign Et
                        </button>
                      </>
                    )}

                    {status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => setStopModal(test)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                        >
                          ⏹ Durdur
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}/results`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          📊 Sonuçlar
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}/monitor`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          🔴 Canlı İzle
                        </button>
                      </>
                    )}

                    {status === 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}/results`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          📊 Sonuçlar
                        </button>
                        <button
                          onClick={() => router.push(`/teacher/tests/${test.id}`)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          📋 Tekrar Assign Et
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
