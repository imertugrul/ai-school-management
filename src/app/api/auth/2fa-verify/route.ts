/**
 * POST /api/auth/2fa-verify
 * Body: { token: "123456" }
 * Verifies TOTP token for the current session user.
 * On success the client calls session.update({ twoFactorPassed: true }).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/twoFactor'
import { memLoginLimiter } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 3 attempts per email
  const rl = memLoginLimiter.limit(`2fa:${session.user.email}`)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' },
      { status: 429 }
    )
  }

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
  })

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
  }

  const { token } = await request.json()

  const isValid = await verifyToken(user.id, token)
  if (!isValid) {
    return NextResponse.json({ error: 'Geçersiz kod. Tekrar deneyin.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
