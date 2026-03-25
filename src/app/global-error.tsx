'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            {/* Logo */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 32px rgba(30,58,95,0.25)',
              }}
            >
              <span style={{ fontSize: '28px' }}>🏫</span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
              Something went wrong
            </h1>

            <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6, marginBottom: '32px' }}>
              We&apos;ve been notified and are working on a fix.
              <br />
              Please try again or return to the home page.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#1E3A5F',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(30,58,95,0.3)',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  color: '#1E3A5F',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Go to Home
              </a>
            </div>

            {error.digest && (
              <p style={{ marginTop: '24px', fontSize: '11px', color: '#CBD5E1', fontFamily: 'monospace' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
