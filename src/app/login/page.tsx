'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill error from URL params (e.g., after Google OAuth rejection)
  useEffect(() => {
    const urlError = searchParams?.get('error')
    if (urlError === 'PENDING_APPROVAL') {
      setError('PENDING_APPROVAL')
    } else if (urlError === 'ACCOUNT_SUSPENDED') {
      setError('ACCOUNT_SUSPENDED')
    }
  }, [searchParams])

  function roleRedirect(role: string) {
    if (role === 'ADMIN') return '/manage-panel'
    if (role === 'TEACHER') return '/teacher/dashboard'
    if (role === 'SOCIAL_MEDIA_MANAGER') return '/social-media-hub/dashboard'
    if (role === 'PARENT') return '/parent/dashboard'
    if (['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY'].includes(role)) return '/staff-panel'
    return '/student/dashboard'
  }

  useEffect(() => {
    const checkSession = async () => {
      if (status === 'loading') return

      if (session) {
        try {
          const response = await fetch('/api/auth/me')
          const data = await response.json()
          router.push(roleRedirect(data.user?.role ?? ''))
        } catch (error) {
          console.error('Error checking session:', error)
        }
      }
    }

    checkSession()
  }, [session, status, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'PENDING_APPROVAL') {
          setError('PENDING_APPROVAL')
        } else if (result.error === 'ACCOUNT_SUSPENDED') {
          setError('ACCOUNT_SUSPENDED')
        } else {
          setError('Invalid email or password')
        }
        setLoading(false)
        return
      }

      if (result?.ok) {
        const meResponse = await fetch('/api/auth/me')
        const meData = await meResponse.json()
        router.push(roleRedirect(meData.user?.role ?? ''))
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    signIn('google')
  }

  const handleMicrosoftLogin = () => {
    signIn('azure-ad')
  }

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <div className="card">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Sign in with Google</span>
            </button>

            <button
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f25022" d="M0 0h11v11H0z"/>
                <path fill="#00a4ef" d="M12 0h11v11H12z"/>
                <path fill="#7fba00" d="M0 12h11v11H0z"/>
                <path fill="#ffb900" d="M12 12h11v11H12z"/>
              </svg>
              <span className="text-gray-700 font-medium">Sign in with Microsoft</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-6">
            {error === 'PENDING_APPROVAL' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
                <p className="text-amber-800 font-semibold text-sm mb-1">⏳ Hesabınız onay bekliyor</p>
                <p className="text-amber-700 text-sm">Yönetici hesabınızı onayladıktan sonra giriş yapabilirsiniz.</p>
              </div>
            )}
            {error === 'ACCOUNT_SUSPENDED' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4">
                <p className="text-red-800 font-semibold text-sm mb-1">🚫 Hesabınız askıya alınmıştır</p>
                <p className="text-red-700 text-sm">Lütfen yönetici ile iletişime geçin.</p>
              </div>
            )}
            {error && error !== 'PENDING_APPROVAL' && error !== 'ACCOUNT_SUSPENDED' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@school.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
