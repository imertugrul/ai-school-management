/**
 * POST /api/admin/2fa/disable
 * Body: { password: "..." }
 * Verifies the admin's password and disables 2FA.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { disableTwoFactor } from '@/lib/twoFactor'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { email: session.user.email },
    select: { id: true, role: true, password: true, twoFactorEnabled: true },
  })

  if (user?.role !== 'ADMIN')    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  if (!user.twoFactorEnabled)    return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })

  const { password } = await request.json()
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

  const isValid = user.password ? await verifyPassword(password, user.password) : false
  if (!isValid) return NextResponse.json({ error: 'Şifre hatalı.' }, { status: 401 })

  await disableTwoFactor(user.id)

  return NextResponse.json({ success: true })
}
