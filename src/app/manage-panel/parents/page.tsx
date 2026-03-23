'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

interface StudentSummary {
  id:        string
  name:      string
  email:     string
  class:     { id: string; name: string } | null
  guardians: { id: string; isPrimary: boolean }[]
}

interface Guardian {
  id:            string
  name:          string
  relationship:  string
  email:         string | null
  phone:         string | null
  isPrimary:     boolean
  receivesEmail: boolean
  receivesSMS:   boolean
  note:          string | null
  userId:        string | null
  user:          { id: string; email: string } | null
}

interface FormState {
  name:             string
  relationship:     string
  email:            string
  phone:            string
  isPrimary:        boolean
  receivesEmail:    boolean
  receivesSMS:      boolean
  note:             string
  givePortalAccess: boolean
}

const BLANK_FORM: FormState = {
  name: '', relationship: 'Anne', email: '', phone: '',
  isPrimary: false, receivesEmail: true, receivesSMS: false,
  note: '', givePortalAccess: false,
}

const RELATIONSHIPS = ['Anne', 'Baba', 'Vasi', 'Diğer']

function guardianStatus(count: number) {
  if (count === 0) return { icon: '❌', label: 'Veli yok',   color: 'text-red-500'    }
  if (count === 1) return { icon: '⚠️', label: '1 veli',     color: 'text-yellow-500' }
  return              { icon: '✅', label: `${count} veli`, color: 'text-green-600'  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ParentsPage() {
  const router = useRouter()

  const [students,     setStudents]     = useState<StudentSummary[]>([])
  const [loadingList,  setLoadingList]  = useState(true)
  const [classFilter,  setClassFilter]  = useState('all')
  const [search,       setSearch]       = useState('')

  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [guardians,    setGuardians]    = useState<Guardian[]>([])
  const [loadingGuard, setLoadingGuard] = useState(false)

  const [modal,       setModal]       = useState<'add' | 'edit' | null>(null)
  const [editTarget,  setEditTarget]  = useState<Guardian | null>(null)
  const [form,        setForm]        = useState<FormState>(BLANK_FORM)
  const [saving,      setSaving]      = useState(false)
  const [modalError,  setModalError]  = useState('')
  const [tempPass,    setTempPass]    = useState<string | null>(null)

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setLoadingList(true)
    try {
      const res  = await fetch('/api/admin/guardians')
      const data = await res.json()
      setStudents(data.students ?? [])
    } catch { showToast('Öğrenci listesi yüklenemedi', 'err') }
    finally   { setLoadingList(false) }
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  const loadGuardians = useCallback(async (id: string) => {
    setLoadingGuard(true)
    setGuardians([])
    try {
      const res  = await fetch(`/api/admin/students/${id}/guardians`)
      const data = await res.json()
      setGuardians(data.guardians ?? [])
    } catch { showToast('Veli bilgileri yüklenemedi', 'err') }
    finally   { setLoadingGuard(false) }
  }, [])

  const selectStudent = (id: string) => {
    setSelectedId(id)
    loadGuardians(id)
    setTempPass(null)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const classes = Array.from(
    new Set(students.map(s => s.class?.name).filter(Boolean) as string[])
  ).sort()

  const filtered = students.filter(s => {
    const okClass  = classFilter === 'all' || s.class?.name === classFilter
    const okSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return okClass && okSearch
  })

  const grouped = [
    ...classes
      .filter(c => classFilter === 'all' || c === classFilter)
      .map(c => ({ label: c, list: filtered.filter(s => s.class?.name === c) }))
      .filter(g => g.list.length > 0),
    ...(filtered.filter(s => !s.class).length > 0
      ? [{ label: 'Sınıfsız', list: filtered.filter(s => !s.class) }]
      : []),
  ]

  const missingCount  = students.filter(s => s.guardians.length === 0).length
  const selectedStud  = students.find(s => s.id === selectedId) ?? null

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openAdd() {
    setForm(BLANK_FORM)
    setEditTarget(null)
    setModalError('')
    setModal('add')
  }

  function openEdit(g: Guardian) {
    setForm({
      name: g.name, relationship: g.relationship,
      email: g.email ?? '', phone: g.phone ?? '',
      isPrimary: g.isPrimary, receivesEmail: g.receivesEmail, receivesSMS: g.receivesSMS,
      note: g.note ?? '', givePortalAccess: !!g.userId,
    })
    setEditTarget(g)
    setModalError('')
    setModal('edit')
  }

  async function saveGuardian() {
    if (!form.name.trim())    { setModalError('Ad Soyad zorunludur'); return }
    if (!form.relationship)   { setModalError('İlişki tipi zorunludur'); return }
    if (form.givePortalAccess && !form.email) {
      setModalError('Portal erişimi için e-posta adresi gereklidir'); return
    }
    setSaving(true)
    setModalError('')
    try {
      const url    = modal === 'edit'
        ? `/api/admin/students/${selectedId}/guardians/${editTarget!.id}`
        : `/api/admin/students/${selectedId}/guardians`
      const method = modal === 'edit' ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setModalError(data.error || 'İşlem başarısız'); return }
      if (data.tempPassword) setTempPass(data.tempPassword)
      setModal(null)
      showToast(modal === 'edit' ? 'Veli güncellendi' : 'Veli eklendi')
      await Promise.all([loadGuardians(selectedId!), loadStudents()])
    } catch { setModalError('Bir hata oluştu') }
    finally   { setSaving(false) }
  }

  async function deleteGuardian(g: Guardian) {
    if (!confirm(`"${g.name}" velisini silmek istiyor musunuz?`)) return
    try {
      const res  = await fetch(`/api/admin/students/${selectedId}/guardians/${g.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { showToast(data.error, 'err'); return }
      showToast('Veli silindi')
      await Promise.all([loadGuardians(selectedId!), loadStudents()])
    } catch { showToast('Silinemedi', 'err') }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/manage-panel')} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
            ← Panel
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white text-lg">👨‍👩‍👧</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Veli Yönetimi</h1>
              <p className="text-xs text-gray-500">Guardian modeli</p>
            </div>
          </div>
          {missingCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-medium">
              ⚠️ {missingCount} öğrencinin veli bilgisi eksik
            </span>
          )}
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6 min-h-0">

        {/* ── LEFT — student list ─────────────────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm space-y-2">
            <input
              type="text" placeholder="Öğrenci ara..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-field text-sm"
            />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field text-sm">
              <option value="all">Tüm sınıflar</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Öğrenciler</span>
              <span className="text-xs text-gray-400">{filtered.length}</span>
            </div>
            {loadingList ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : grouped.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">Öğrenci bulunamadı</p>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 290px)' }}>
                {grouped.map(g => (
                  <div key={g.label}>
                    <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{g.label}</span>
                    </div>
                    {g.list.map(s => {
                      const st = guardianStatus(s.guardians.length)
                      const active = s.id === selectedId
                      return (
                        <button
                          key={s.id}
                          onClick={() => selectStudent(s.id)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-gray-50 transition-colors ${
                            active ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className={`flex-1 text-sm font-medium truncate ${active ? 'text-teal-700' : 'text-gray-900'}`}>
                            {s.name}
                          </span>
                          <span className={`text-sm shrink-0 ${st.color}`} title={st.label}>{st.icon}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT — guardian detail ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selectedStud ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-3">👈</div>
                <p className="font-medium">Soldaki listeden bir öğrenci seçin</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedStud.name} — Veli Bilgileri</h2>
                  <p className="text-sm text-gray-500">{selectedStud.class?.name ?? 'Sınıf yok'} · {selectedStud.email}</p>
                </div>
                <button onClick={openAdd} className="btn-primary text-sm">+ Veli Ekle</button>
              </div>

              {/* Temp password */}
              {tempPass && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">🔑 Yeni portal hesabı oluşturuldu</p>
                  <p className="text-amber-700">Geçici şifre: <code className="font-mono bg-amber-100 px-2 py-0.5 rounded select-all">{tempPass}</code></p>
                  <p className="text-amber-600 text-xs mt-1">Bu şifreyi veliye iletin. Sayfa yenilenince görünmeyecek.</p>
                </div>
              )}

              {/* Guardian cards */}
              {loadingGuard ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : guardians.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                  <div className="text-4xl mb-3">👤</div>
                  <p className="font-medium">Bu öğrenci için veli kaydı yok</p>
                  <button onClick={openAdd} className="btn-primary mt-4 text-sm">+ İlk Veliyi Ekle</button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {guardians.map(g => (
                    <GuardianCard key={g.id} guardian={g} onEdit={openEdit} onDelete={deleteGuardian} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <GuardianModal
          title={modal === 'edit' ? 'Veliyi Düzenle' : 'Yeni Veli Ekle'}
          form={form} setForm={setForm}
          onSave={saveGuardian} onClose={() => setModal(null)}
          saving={saving} error={modalError}
          isEdit={modal === 'edit'}
          alreadyHasPortal={modal === 'edit' && !!editTarget?.userId}
        />
      )}
    </div>
  )
}

// ── Guardian Card ─────────────────────────────────────────────────────────────

const REL_ICON: Record<string, string> = { Anne: '👩', Baba: '👨', Vasi: '🧑', Diğer: '👤' }

function GuardianCard({
  guardian: g, onEdit, onDelete,
}: { guardian: Guardian; onEdit: (g: Guardian) => void; onDelete: (g: Guardian) => void }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${
      g.isPrimary ? 'border-teal-300 ring-1 ring-teal-200' : 'border-gray-200'
    }`}>
      {g.isPrimary && (
        <p className="text-xs font-semibold text-teal-600">⭐ Ana İletişim Sorumlusu</p>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white text-xl">{REL_ICON[g.relationship] ?? '👤'}</span>
        </div>
        <div>
          <p className="font-bold text-gray-900">{g.name}</p>
          <p className="text-sm text-gray-500">{g.relationship}</p>
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {g.email && <p>📧 {g.email}</p>}
        {g.phone && <p>📱 {g.phone}</p>}
        <p className={g.receivesEmail ? 'text-green-600' : 'text-gray-400'}>
          ✉️ Email bülteni: {g.receivesEmail ? 'Açık' : 'Kapalı'}
        </p>
        <p className={g.user ? 'text-blue-600' : 'text-gray-400'}>
          🔐 Portal hesabı: {g.user ? 'Var' : 'Yok'}
        </p>
      </div>

      {g.note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
          🔒 {g.note}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onEdit(g)}
          className="flex-1 text-sm py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
          Düzenle
        </button>
        <button onClick={() => onDelete(g)}
          className="flex-1 text-sm py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
          Sil
        </button>
      </div>
    </div>
  )
}

// ── Guardian Modal ────────────────────────────────────────────────────────────

function GuardianModal({
  title, form, setForm, onSave, onClose, saving, error, isEdit, alreadyHasPortal,
}: {
  title: string; form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>
  onSave: () => void; onClose: () => void; saving: boolean; error: string
  isEdit: boolean; alreadyHasPortal: boolean
}) {
  const tf = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const cb = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [k]: e.target.checked }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
            <input value={form.name} onChange={tf('name')} className="input-field" placeholder="Ayşe Yılmaz" />
          </div>

          {/* Relationship + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İlişki *</label>
              <select value={form.relationship} onChange={tf('relationship')} className="input-field">
                {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input value={form.phone} onChange={tf('phone')} className="input-field" placeholder="+90 532 ..." type="tel" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input value={form.email} onChange={tf('email')} className="input-field" placeholder="veli@email.com" type="email" />
          </div>

          {/* Preferences */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-1">İletişim Tercihleri</p>
            {(['receivesEmail', 'receivesSMS', 'isPrimary'] as const).map(k => (
              <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form[k] as boolean} onChange={cb(k)} className="rounded" />
                {k === 'receivesEmail' && '✉️ Email bülteni gönder'}
                {k === 'receivesSMS'   && '📱 SMS gönder (yakında)'}
                {k === 'isPrimary'     && '⭐ Ana iletişim sorumlusu yap'}
              </label>
            ))}
          </div>

          {/* Portal access */}
          {!alreadyHasPortal ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-blue-800 cursor-pointer">
                <input type="checkbox" checked={form.givePortalAccess} onChange={cb('givePortalAccess')} className="rounded" />
                🔐 Bu veliye sistem girişi ver
              </label>
              {form.givePortalAccess && (
                <p className="text-xs text-blue-600 ml-6">
                  Yukarıdaki e-posta adresiyle hesap oluşturulur veya mevcut hesap bağlanır.
                  Geçici şifre sayfada gösterilecek.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              🔐 Bu velinin zaten portal hesabı var.
            </p>
          )}

          {/* Admin note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔒 Gizli Not (sadece admin görür)</label>
            <textarea value={form.note} onChange={tf('note')} className="input-field" rows={2} placeholder="İdari notlar..." />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Veli Ekle')}
          </button>
          <button onClick={onClose} className="btn-secondary">İptal</button>
        </div>
      </div>
    </div>
  )
}
