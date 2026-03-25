'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false
  const ts = localStorage.getItem(DISMISSED_KEY)
  if (!ts) return false
  return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode() || isDismissed()) return

    if (isIOS()) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setShowIOSInstructions(true), 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    setShowBanner(false)
    setShowIOSInstructions(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    } else {
      dismiss()
    }
    setDeferredPrompt(null)
  }

  if (showBanner && deferredPrompt) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          color: '#fff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 22,
          }}
        >
          🏫
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>SchoolPro AI uygulamasını yükle</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            Ana ekrana ekle, internet olmadan da çalışır
          </div>
        </div>
        <button
          onClick={handleInstall}
          style={{
            background: '#F59E0B',
            color: '#1E3A5F',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Yükle
        </button>
        <button
          onClick={dismiss}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 10px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
    )
  }

  if (showIOSInstructions) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 16,
          right: 16,
          zIndex: 9999,
          background: '#1E3A5F',
          color: '#fff',
          padding: '16px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Ana Ekrana Ekle</div>
          <button
            onClick={dismiss}
            style={{
              background: 'none',
              color: 'rgba(255,255,255,0.6)',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
          Bu uygulamayı ana ekranına eklemek için:
          <br />
          1. Tarayıcının alt menüsünde{' '}
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 4 }}>
            Paylaş
          </span>{' '}
          butonuna dokun
          <br />
          2.{' '}
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 4 }}>
            Ana Ekrana Ekle
          </span>{' '}
          seçeneğini seç
        </div>
        {/* Triangle pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid #1E3A5F',
          }}
        />
      </div>
    )
  }

  return null
}
