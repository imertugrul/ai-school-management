'use client'

import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}
