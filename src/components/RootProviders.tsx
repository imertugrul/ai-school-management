'use client'

import { SessionProvider } from 'next-auth/react'
import Link from 'next/link'

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <footer className="border-t border-gray-100 bg-white py-3 text-center text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600 hover:underline transition-colors">
          Privacy Policy
        </Link>
        <span className="mx-2">·</span>
        <span>KVKK / GDPR Compliant</span>
      </footer>
    </SessionProvider>
  )
}
