import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = request.nextUrl

  // Allow NextAuth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token.role !== 'ADMIN') {
      // Redirect to appropriate dashboard
      if (token.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // Teacher routes protection
  if (pathname.startsWith('/teacher')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Only allow TEACHER and ADMIN
    if (token.role !== 'TEACHER' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // Student routes protection
  if (pathname.startsWith('/student')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Only allow STUDENT
    if (token.role !== 'STUDENT') {
      if (token.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      if (token.role === 'PARENT') {
        return NextResponse.redirect(new URL('/parent/dashboard', request.url))
      }
    }
  }

  // Parent routes protection
  if (pathname.startsWith('/parent')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (token.role !== 'PARENT' && token.role !== 'ADMIN') {
      if (token.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*'
  ]
}
