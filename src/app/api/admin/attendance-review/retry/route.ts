/**
 * POST /api/admin/attendance-review/retry
 * { notificationId: string } — retry FAILED notification
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendAbsenceNotification } from '@/lib/notifications/absenceNotification'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { notificationId } = await request.json()
    if (!notificationId) return NextResponse.json({ error: 'notificationId required' }, { status: 400 })

    const notif = await prisma.absenceNotification.findUnique({ where: { id: notificationId } })
    if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (notif.status !== 'FAILED') {
      return NextResponse.json({ error: 'Sadece FAILED durumundaki bildirimler yeniden gönderilebilir' }, { status: 400 })
    }

    // Reset to APPROVED so sendAbsenceNotification can process it
    await prisma.absenceNotification.update({
      where: { id: notificationId },
      data: { status: 'APPROVED', emailSent: false, whatsappSent: false, emailError: null, whatsappError: null },
    })

    sendAbsenceNotification(notificationId).catch(e => console.error('retry error:', e))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
