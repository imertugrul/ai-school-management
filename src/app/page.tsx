'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { LanguageProvider } from '@/context/LanguageContext'
import LandingNavbar       from '@/components/landing/LandingNavbar'
import LandingHero         from '@/components/landing/LandingHero'
import LandingStats        from '@/components/landing/LandingStats'
import LandingRoles        from '@/components/landing/LandingRoles'
import LandingFeatures     from '@/components/landing/LandingFeatures'
import LandingSocialHub   from '@/components/landing/LandingSocialHub'
import LandingSecurity    from '@/components/landing/LandingSecurity'
import LandingComparison  from '@/components/landing/LandingComparison'
import LandingHowItWorks   from '@/components/landing/LandingHowItWorks'
import LandingTestimonials from '@/components/landing/LandingTestimonials'
import LandingPricing      from '@/components/landing/LandingPricing'
import LandingFAQ          from '@/components/landing/LandingFAQ'
import LandingContact      from '@/components/landing/LandingContact'
import LandingFooter       from '@/components/landing/LandingFooter'
import StructuredData      from '@/components/StructuredData'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) return
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if      (d.user?.role === 'ADMIN')   router.push('/manage-panel')
        else if (d.user?.role === 'TEACHER') router.push('/teacher/dashboard')
        else if (d.user?.role === 'STUDENT') router.push('/student/dashboard')
        else if (d.user?.role === 'PARENT')  router.push('/parent/dashboard')
      })
      .catch(() => {})
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-hero)' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <LanguageProvider>
      <StructuredData />
      <div className="font-body" style={{ overflowX: 'hidden' }}>
        <LandingNavbar />
        <LandingHero />
        <LandingStats />
        <LandingRoles />
        <LandingFeatures />
        <LandingSocialHub />
        <LandingHowItWorks />
        <LandingSecurity />
        <LandingTestimonials />
        <LandingComparison />
        <LandingPricing />
        <LandingFAQ />
        <LandingContact />
        <LandingFooter />
      </div>
    </LanguageProvider>
  )
}
