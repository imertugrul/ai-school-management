'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function CompleteSignup() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const completeSignup = async () => {
      // Prevent multiple executions
      if (isProcessing) return
      
      if (status === 'loading') return
      
      if (!session) {
        router.push('/login')
        return
      }

      setIsProcessing(true)

      try {
        // Get user role and redirect
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        
        if (data.user?.role === 'ADMIN') {
          router.replace('/admin')
        } else if (data.user?.role === 'TEACHER') {
          router.replace('/teacher/dashboard')
        } else {
          router.replace('/student/dashboard')
        }
      } catch (error) {
        console.error('Error getting user:', error)
        router.replace('/login')
      }
    }

    completeSignup()
  }, [session, status, router, isProcessing])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  )
}
