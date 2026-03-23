/**
 * POST /api/admin/attendance-review/[id]/approve
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendAbsenceNotification } from '@/lib/notifications/absenceNotification'

type Ctx = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const notif = await prisma.absenceNotification.findUnique({ where: { id: params.id } })
    if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (notif.status !== 'PENDING') {
      return NextResponse.json({ error: `Durum zaten: ${notif.status}` }, { status: 400 })
    }

    await prisma.absenceNotification.update({
      where: { id: params.id },
      data: { status: 'APPROVED', reviewedById: admin.id, reviewedAt: new Date() },
    })

    // Fire-and-forget: send notification
    sendAbsenceNotification(params.id).catch(e => console.error('sendAbsenceNotification error:', e))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
