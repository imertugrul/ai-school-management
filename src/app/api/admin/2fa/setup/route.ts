/**
 * GET /api/admin/2fa/setup
 * Generate a new TOTP secret + QR code for the authenticated admin.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { generateSecret } from '@/lib/twoFactor'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, role: true, email: true, twoFactorEnabled: true },
  })

  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  if (user.twoFactorEnabled)  return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })

  const { secret, qrCode } = await generateSecret(user.id, user.email)

  return NextResponse.json({ secret, qrCode })
}
