'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import * as Sentry from '@sentry/nextjs'

export default function SentryUserContext() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      Sentry.setUser({
        id: user.id ?? user.email ?? 'unknown',
        username: (user.role ?? 'user') + '_user',
      })
    } else {
      Sentry.setUser(null)
    }
  }, [session])

  return null
}
