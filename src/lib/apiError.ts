import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context?: string) {
  console.error(`API Error in ${context}:`, error)
  Sentry.captureException(error, {
    tags: { context: context ?? 'unknown' },
  })
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error instanceof Error
      ? error.message
      : 'Unknown error'
  return NextResponse.json({ error: message }, { status: 500 })
}
