'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
export default function SentryTest() {
  useEffect(() => {
    Sentry.captureMessage('Sentry is working! 🎉')
  }, [])
  return <div>Sentry test page</div>
}
