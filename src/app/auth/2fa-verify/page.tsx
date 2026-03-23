'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || 'manage-panel'

export default function TwoFactorVerifyPage() {
  const { data: session, status, update } = useSession()
  const router  = useRouter()
  const [code,   setCode]   = useState('')
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && session?.user?.twoFactorPassed) {
      router.push(`/${ADMIN_PATH}`)
    }
    inputRef.current?.focus()
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    setError('')
    setLoading(true)

    try {
      const res  = await fetch('/api/auth/2fa-verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Geçersiz kod.')
        setCode('')
        inputRef.current?.focus()
        return
      }

      // Mark 2FA as passed in the session JWT
      await update({ twoFactorPassed: true })
      router.push(`/${ADMIN_PATH}`)

    } catch {
      setError('Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">İki Adımlı Doğrulama</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Google Authenticator veya Authy uygulamanızdaki<br />
            6 haneli kodu girin
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doğrulama Kodu
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Kod her 30 saniyede bir yenilenir
          </p>
        </div>
      </div>
    </div>
  )
}
