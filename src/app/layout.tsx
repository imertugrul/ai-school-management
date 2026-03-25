import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import RootProviders from '@/components/RootProviders'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import * as Sentry from '@sentry/nextjs'

const inter = Inter({ subsets: ['latin'] })

const BASE = 'https://www.schoolproai.com'

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(BASE),

    title: {
      default: 'SchoolPro AI — Yapay Zeka Destekli Okul Yönetim Sistemi',
      template: '%s | SchoolPro AI',
    },

    description:
      'AI ile ders planla, otomatik not ver, velilerle anlık iletişim kur. IB, AP, MEB, IGCSE destekli okul yönetim platformu. KVKK uyumlu.',

    keywords: [
      'okul yönetim sistemi',
      'yapay zeka eğitim',
      'AI ders planı',
      'otomatik not sistemi',
      'veli bilgilendirme sistemi',
      'school management system',
      'AI lesson planner',
      'IB okul sistemi',
      'MEB uyumlu yazılım',
      'IGCSE yönetim',
      'öğrenci takip sistemi',
      'devamsızlık takip',
      'SchoolPro AI',
    ],

    authors: [{ name: 'SchoolPro AI' }],

    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_US', 'de_DE'],
      url: BASE,
      siteName: 'SchoolPro AI',
      title: 'SchoolPro AI — Yapay Zeka Destekli Okul Yönetim Sistemi',
      description: 'AI ile ders planla, otomatik not ver, velilerle anlık iletişim kur.',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'SchoolPro AI — Okul Yönetim Sistemi',
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: 'SchoolPro AI — Yapay Zeka Destekli Okul Yönetim Sistemi',
      description: 'AI ile ders planla, otomatik not ver, velilerle anlık iletişim kur.',
      images: ['/og-image.png'],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),

    alternates: {
      canonical: '/',
      languages: {
        'tr-TR': '/',
        'en-US': '/',
        'de-DE': '/',
      },
    },

    manifest: '/manifest.json',

    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'SchoolPro AI',
    },

    formatDetection: {
      telephone: false,
    },

    other: {
      ...Sentry.getTraceData(),
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta name="theme-color" content="#1E3A5F" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
