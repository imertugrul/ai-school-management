'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Profile {
  id: string; name: string; email: string; phone: string
  relationship: string; receivesEmail: boolean; receivesSMS: boolean
}

export default function ParentProfile() {
  const { language, setLanguage, t } = useLanguage()
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [form, setForm]         = useState({ name: '', phone: '', receivesEmail: true, receivesSMS: false })
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError]   = useState('')

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetch('/api/parent/profile')
      .then(r => r.json())
      .then(d => {
        const p = d.profile
        setProfile(p)
        setForm({ name: p.name, phone: p.phone ?? '', receivesEmail: p.receivesEmail, receivesSMS: p.receivesSMS })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/parent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Hata', false); return }
      showToast(t('dashboard.parent.profileUpdated'))
    } finally { setSaving(false) }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError(t('dashboard.parent.passwordMismatch')); return }
    if (pwForm.next.length < 8) { setPwError(t('dashboard.parent.passwordTooShort')); return }
    setSaving(true)
    try {
      const r = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const d = await r.json()
      if (!r.ok) { setPwError(d.error || 'Hata'); return }
      showToast(t('dashboard.parent.passwordChanged'))
      setShowPwForm(false)
      setPwForm({ current: '', next: '', confirm: '' })
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('dashboard.parent.profileTitle')}</h1>
        <p className="text-sm text-gray-400">{t('dashboard.parent.profileSubtitle')}</p>
      </div>

      {/* Avatar */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 flex items-center gap-4 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
          {profile?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-lg font-bold">{profile?.name}</p>
          <p className="text-indigo-200 text-sm">{profile?.relationship || 'Veli'}</p>
          <p className="text-indigo-200 text-xs">{profile?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">{t('dashboard.parent.personalInfo')}</h3>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('dashboard.parent.nameLabel')}</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input-field text-sm w-full"
            placeholder={t('dashboard.parent.nameLabel')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('dashboard.parent.emailLabel')}</label>
          <input value={profile?.email ?? ''} readOnly className="input-field text-sm w-full bg-gray-50 text-gray-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('dashboard.parent.phoneLabel')}</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="input-field text-sm w-full"
            placeholder="0532 000 00 00"
          />
        </div>

        <h3 className="font-semibold text-gray-900 text-sm pt-2">{t('dashboard.parent.notifications')}</h3>

        {([
          { key: 'receivesEmail', tKey: 'dashboard.parent.emailNotif' },
          { key: 'receivesSMS',   tKey: 'dashboard.parent.whatsappNotif' },
        ] as const).map(({ key, tKey }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form[key as keyof typeof form] ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key as keyof typeof form] ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">{t(tKey)}</span>
          </label>
        ))}

        <button type="submit" disabled={saving} className="w-full btn-primary text-sm py-2.5 disabled:opacity-50">
          {saving ? t('dashboard.common.saving') : t('dashboard.common.save')}
        </button>
      </form>

      {/* Language selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm">{t('dashboard.common.language')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
            { code: 'en', flag: '🇬🇧', label: 'English' },
          ] as const).map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                language === code
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{flag}</span>
              <span>{label}</span>
              {language === code && <span className="ml-auto text-blue-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowPwForm(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        >
          <span className="text-sm font-medium text-gray-900">🔒 {t('dashboard.parent.changePassword')}</span>
          <span className="text-gray-400 text-sm">{showPwForm ? '▲' : '▼'}</span>
        </button>
        {showPwForm && (
          <form onSubmit={handlePasswordChange} className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
            {pwError && <p className="text-xs text-red-600">{pwError}</p>}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('dashboard.parent.currentPassword')}</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} className="input-field text-sm w-full" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('dashboard.parent.newPassword')}</label>
              <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} className="input-field text-sm w-full" minLength={8} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('dashboard.parent.confirmPassword')}</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className="input-field text-sm w-full" minLength={8} required />
            </div>
            <button type="submit" disabled={saving} className="w-full btn-primary text-sm py-2.5 disabled:opacity-50">
              {saving ? t('dashboard.common.saving') : t('dashboard.parent.changePassword')}
            </button>
          </form>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-24 left-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-center ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
