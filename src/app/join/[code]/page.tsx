'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'

export default function JoinTestPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const { data: session, status } = useSession()
  const [message, setMessage] = useState('Checking test code...')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login, then come back here
      router.push(`/login?redirect=/join/${code}`)
      return
    }

    if (status === 'authenticated') {
      joinTest()
    }
  }, [status, code])

  const joinTest = async () => {
    try {
      setMessage('Finding test...')

      // Find test by access code
      const response = await fetch(`/api/tests/join/${code}`)
      const data = await response.json()

      if (!data.success) {
        setError(true)
        setMessage(data.error || 'Test not found!')
        return
      }

      const test = data.test

      // Check if test is active
      if (!test.isActive) {
        setError(true)
        setMessage('This test is not active yet!')
        return
      }

      // Check dates
      const now = new Date()
      if (test.startDate && now < new Date(test.startDate)) {
        setError(true)
        setMessage(`This test will start on ${new Date(test.startDate).toLocaleString('en-US')}`)
        return
      }

      if (test.endDate && now > new Date(test.endDate)) {
        setError(true)
        setMessage('This test has expired!')
        return
      }

      setMessage('Assigning test to you...')

      // Auto-assign test to student
      const assignResponse = await fetch('/api/tests/join/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id }),
      })

      const assignData = await assignResponse.json()

      if (assignData.success) {
        setMessage('Redirecting to test...')
        setTimeout(() => {
          router.push(`/student/test/${test.id}`)
        }, 500)
      } else {
        setError(true)
        setMessage(assignData.error || 'Failed to join test!')
      }

    } catch (err: any) {
      console.error('Error:', err)
      setError(true)
      setMessage('An error occurred!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="btn-primary w-full"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Joining Test</h2>
            <p className="text-gray-600">{message}</p>
            <div className="mt-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 animate-pulse w-2/3"></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
