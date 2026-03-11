import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }
  }

  // Teacher routes protection
  if (pathname.startsWith('/teacher')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token.role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
  }

  // Student routes protection
  if (pathname.startsWith('/student')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*'
  ]
}
