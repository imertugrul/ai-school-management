'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEACHER' as 'TEACHER' | 'STUDENT',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // ── Success / Pending approval screen ──────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="card py-10 px-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Hesabınız Oluşturuldu!</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 text-left">
              <p className="text-amber-900 font-semibold text-sm mb-1">Onay Bekleniyor</p>
              <p className="text-amber-800 text-sm leading-relaxed">
                Hesabınız şu anda inceleme aşamasındadır. Yönetici onayladıktan
                sonra giriş yapabilirsiniz.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full btn-secondary"
            >
              ← Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join AI School Management System</p>
        </div>

        <div className="card">
          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📌 Note:</strong> If your school uses Google Workspace, you can login directly with your school email on the{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-semibold">Login page</Link>.
            </p>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input id="name" type="text" required className="input-field"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input id="email" type="email" required className="input-field"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@school.edu" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input id="password" type="password" required minLength={6} className="input-field"
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters" />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <select id="role" className="input-field" value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as 'TEACHER' | 'STUDENT' })}>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
