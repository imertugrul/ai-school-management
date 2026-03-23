/**
 * POST /api/admin/2fa/enable
 * Body: { token: "123456" }
 * Verifies the OTP and enables 2FA for the authenticated admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { verifyToken, enableTwoFactor } from '@/lib/twoFactor'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, role: true, twoFactorEnabled: true, twoFactorSecret: true },
  })

  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  if (user.twoFactorEnabled)  return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })
  if (!user.twoFactorSecret)  return NextResponse.json({ error: 'Run setup first' }, { status: 400 })

  const { token } = await request.json()

  const isValid = await verifyToken(user.id, token)
  if (!isValid) return NextResponse.json({ error: 'Geçersiz kod. Tekrar deneyin.' }, { status: 400 })

  await enableTwoFactor(user.id)

  return NextResponse.json({ success: true })
}
