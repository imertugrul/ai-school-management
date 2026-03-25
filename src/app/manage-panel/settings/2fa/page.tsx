'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function TwoFactorSetupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean | null>(null)
  const [phase, setPhase] = useState<'idle' | 'setup' | 'disabling'>('idle')
  const [qrCode,  setQrCode]  = useState('')
  const [secret,  setSecret]  = useState('')
  const [code,    setCode]    = useState('')
  const [password, setPassword] = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      setTwoFaEnabled(session?.user?.twoFactorEnabled ?? false)
    }
  }, [status, session])

  // ── Start 2FA setup ──────────────────────────────────────────────────────
  async function startSetup() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/2fa/setup')
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setPhase('setup')
    } catch { setError('An error occurred.') }
    finally  { setLoading(false) }
  }

  // ── Confirm 2FA setup ────────────────────────────────────────────────────
  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/2fa/enable', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTwoFaEnabled(true)
      setPhase('idle')
      setCode('')
      setSuccess('2FA successfully enabled! You will be asked for a verification code on your next login.')
    } catch { setError('An error occurred.') }
    finally  { setLoading(false) }
  }

  // ── Disable 2FA ──────────────────────────────────────────────────────────
  async function disableSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/admin/2fa/disable', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTwoFaEnabled(false)
      setPhase('idle')
      setPassword('')
      setSuccess('2FA has been disabled.')
    } catch { setError('An error occurred.') }
    finally  { setLoading(false) }
  }

  if (status === 'loading' || twoFaEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/manage-panel')} className="text-gray-500 hover:text-gray-900 transition-colors">
            ← Panel
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <h1 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">2FA Status</h2>
              <p className="text-sm text-gray-500 mt-1">
                TOTP-based authentication with Google Authenticator or Authy
              </p>
            </div>
            {twoFaEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                ✓ Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
                Inactive
              </span>
            )}
          </div>

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-5">
            {!twoFaEnabled && phase === 'idle' && (
              <button onClick={startSetup} disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Loading...' : 'Enable 2FA'}
              </button>
            )}
            {twoFaEnabled && phase === 'idle' && (
              <button
                onClick={() => { setPhase('disabling'); setError(''); setSuccess('') }}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
              >
                Disable 2FA
              </button>
            )}
          </div>
        </div>

        {/* QR Code setup */}
        {phase === 'setup' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h3 className="font-semibold text-gray-900">Scan QR Code</h3>
            <p className="text-sm text-gray-500">
              Scan the QR code below with your authenticator app, then enter the generated 6-digit code.
            </p>

            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border border-gray-200 rounded-xl" />
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Secret key for manual entry:</p>
              <code className="text-sm font-mono text-gray-800 break-all select-all">{secret}</code>
            </div>

            <form onSubmit={confirmSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field text-center text-xl tracking-[0.4em] font-mono"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={loading || code.length !== 6} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify and Enable'}
                </button>
                <button type="button" onClick={() => { setPhase('idle'); setError('') }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Disable 2FA */}
        {phase === 'disabling' && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Disable 2FA</h3>
            <p className="text-sm text-gray-500">
              Enter your current password to continue.
            </p>
            <form onSubmit={disableSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  required autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={loading || !password} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex-1">
                  {loading ? 'Processing...' : 'Disable'}
                </button>
                <button type="button" onClick={() => { setPhase('idle'); setError('') }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800 space-y-2">
          <p className="font-semibold">About 2FA</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Google Authenticator, Authy, or 1Password are supported</li>
            <li>Uses TOTP (RFC 6238) standard, refreshed every 30 seconds</li>
            <li>If you lose your phone, 2FA can be disabled via admin DB access</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
