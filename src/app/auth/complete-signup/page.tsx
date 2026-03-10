'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function CompleteSignup() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    const completeSignup = async () => {
      const pendingRole = localStorage.getItem('pendingRole')
      
      if (!pendingRole || !session) {
        router.push('/')
        return
      }

      try {
        await fetch('/api/auth/set-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: pendingRole })
        })

        localStorage.removeItem('pendingRole')
        
        // Redirect based on role
        if (pendingRole === 'TEACHER') {
          router.push('/teacher/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      } catch (error) {
        console.error('Error setting role:', error)
        router.push('/')
      }
    }

    if (status === 'authenticated') {
      completeSignup()
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing your signup...</p>
      </div>
    </div>
  )
}
