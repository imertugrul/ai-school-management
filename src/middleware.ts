import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const ADMIN_PATH = process.env.ADMIN_PATH || 'manage-panel'

const STAFF_ROLES = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY']

// ── Rate limiting (Upstash — only active when env vars are set) ──
let adminRatelimit: any = null
async function getAdminRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (adminRatelimit) return adminRatelimit
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis }     = await import('@upstash/redis')
  adminRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: false,
  })
  return adminRatelimit
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  )
}

export async function middleware(request: NextRequest) {
  const token    = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Allow NextAuth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // ── Admin panel routes ──────────────────────────────────────────────────
  if (pathname.startsWith(`/${ADMIN_PATH}`)) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token.role !== 'ADMIN') {
      // Staff members get redirected to staff-panel
      if (STAFF_ROLES.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/staff-panel', request.url))
      }
      if (token.role === 'TEACHER') return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    // 2FA gate
    if (token.twoFactorEnabled && !token.twoFactorPassed) {
      if (!pathname.startsWith('/auth/2fa-verify')) {
        return NextResponse.redirect(new URL('/auth/2fa-verify', request.url))
      }
    }

    // Rate limiting
    const limiter = await getAdminRatelimit()
    if (limiter) {
      const ip = getIP(request)
      const { success } = await limiter.limit(`admin:${ip}`)
      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: 'Çok fazla deneme. Lütfen 1 dakika sonra tekrar deneyin.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
        )
      }
    }
  }

  // ── Old /admin path → 404 ────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    return new NextResponse(null, { status: 404 })
  }

  // ── Staff panel routes ───────────────────────────────────────────────────
  if (pathname.startsWith('/staff-panel')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    // ADMIN can also access staff-panel (for inspection)
    if (token.role !== 'ADMIN' && !STAFF_ROLES.includes(token.role as string)) {
      if (token.role === 'TEACHER') return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // ── Teacher routes ───────────────────────────────────────────────────────
  if (pathname.startsWith('/teacher')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    if (token.role !== 'TEACHER' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // ── Student routes ───────────────────────────────────────────────────────
  if (pathname.startsWith('/student')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    if (token.role !== 'STUDENT') {
      if (token.role === 'TEACHER')              return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      if (token.role === 'ADMIN')                return NextResponse.redirect(new URL(`/${ADMIN_PATH}`, request.url))
      if (token.role === 'PARENT')               return NextResponse.redirect(new URL('/parent/dashboard', request.url))
      if (STAFF_ROLES.includes(token.role as string)) return NextResponse.redirect(new URL('/staff-panel', request.url))
    }
  }

  // ── Parent routes ────────────────────────────────────────────────────────
  if (pathname.startsWith('/parent')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    if (token.role !== 'PARENT' && token.role !== 'ADMIN') {
      if (token.role === 'TEACHER') return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // ── Social Media Hub routes ──────────────────────────────────────────────
  if (pathname.startsWith('/social-media-hub')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    if (token.role !== 'SOCIAL_MEDIA_MANAGER' && token.role !== 'ADMIN') {
      if (token.role === 'TEACHER') return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/manage-panel/:path*',
    '/admin/:path*',
    '/staff-panel/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
    '/social-media-hub/:path*',
  ],
}
