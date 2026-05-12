'use client'

import { useEffect, useState } from 'react'

interface ResetPasswordModalProps {
  userId:   string
  userName: string
  userEmail?: string
  onClose:  () => void
  onSuccess?: () => void
}

type Mode = 'auto' | 'manual'

export default function ResetPasswordModal({
  userId, userName, userEmail, onClose, onSuccess,
}: ResetPasswordModalProps) {
  const [mode, setMode]                 = useState<Mode>('manual')
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [sendEmailFlag, setSendEmailFlag] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [generatedPwd, setGeneratedPwd] = useState<string | null>(null)
  const [emailed, setEmailed]           = useState(false)
  const [copied, setCopied]             = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'manual') {
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalı.')
        return
      }
      if (password !== confirm) {
        setError('Şifreler eşleşmiyor.')
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          password: mode === 'manual' ? password : undefined,
          sendEmail: sendEmailFlag,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Şifre sıfırlama başarısız.')
        return
      }
      setEmailed(Boolean(data.emailed))
      if (mode === 'auto') {
        setGeneratedPwd(data.password ?? '')
      } else {
        // Manual mode → success state without showing password back
        setGeneratedPwd('')
      }
      onSuccess?.()
    } catch {
      setError('Bağlantı hatası, lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be denied — silent
    }
  }

  // ─── Success view ────────────────────────────────────────────────────────
  if (generatedPwd !== null) {
    const showPlaintext = mode === 'auto' && generatedPwd.length > 0
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Şifre sıfırlandı!</h3>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
          </div>

          {showPlaintext ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-green-800 mb-2">Yeni şifre:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-lg font-bold text-gray-900 bg-white px-3 py-2 rounded-lg border border-green-200 break-all">
                    {generatedPwd}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(generatedPwd)}
                    className="shrink-0 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Bu şifreyi kullanıcıyla paylaşın.</p>
            </>
          ) : (
            <p className="text-sm text-gray-700 mb-4">Şifre başarıyla güncellendi.</p>
          )}

          {emailed && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
              ✉️ Yeni şifre kullanıcının e-postasına gönderildi.
            </p>
          )}

          <div className="flex justify-end">
            <button onClick={onClose} className="btn-primary">Tamam</button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form view ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-xl">🔑</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Şifre Sıfırla</h3>
            <p className="text-xs text-gray-500">{userName}</p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="space-y-2 mb-5">
          <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
            mode === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              checked={mode === 'auto'}
              onChange={() => setMode('auto')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Otomatik şifre oluştur</p>
              <p className="text-xs text-gray-500">Sistem 8 karakterli güvenli bir şifre üretir.</p>
            </div>
          </label>
          <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
            mode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Manuel şifre belirle</p>
              <p className="text-xs text-gray-500">Yeni şifreyi kendin seçersin.</p>
            </div>
          </label>
        </div>

        {/* Manual inputs */}
        {mode === 'manual' ? (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yeni şifre</label>
              <input
                type="password"
                className="input-field"
                placeholder="En az 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tekrar</label>
              <input
                type="password"
                className="input-field"
                placeholder="Şifreyi tekrar yaz"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                minLength={6}
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
            Sistem otomatik güvenli bir şifre oluşturacak ve sıfırlama sonrası gösterecek.
          </div>
        )}

        {/* Email checkbox */}
        {userEmail && (
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailFlag}
              onChange={e => setSendEmailFlag(e.target.checked)}
            />
            <span>Yeni şifreyi e-posta ile gönder <span className="text-gray-400">({userEmail})</span></span>
          </label>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> İşleniyor…</>
              : <>✅ Şifreyi Sıfırla</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
