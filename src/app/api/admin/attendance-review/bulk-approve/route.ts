/**
 * POST /api/admin/attendance-review/bulk-approve
 * { ids?: string[], approveAll?: boolean, date?: string }
 * If approveAll=true, approves all PENDING for that date
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
      select: { id: true, role: true },
    })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { ids, approveAll, date } = await request.json()

    let targetIds: string[] = []

    if (approveAll) {
      const where: any = { status: 'PENDING' }
      if (date) {
        const start = new Date(date); start.setHours(0, 0, 0, 0)
        const end   = new Date(date); end.setHours(23, 59, 59, 999)
        where.date = { gte: start, lte: end }
      }
      const notifs = await prisma.absenceNotification.findMany({ where, select: { id: true } })
      targetIds = notifs.map(n => n.id)
    } else {
      targetIds = (ids as string[]) ?? []
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ approved: 0, message: 'Onaylanacak bildirim bulunamadı' })
    }

    // Mark all as APPROVED
    await prisma.absenceNotification.updateMany({
      where: { id: { in: targetIds }, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedById: admin.id, reviewedAt: new Date() },
    })

    // Send notifications asynchronously
    for (const id of targetIds) {
      sendAbsenceNotification(id).catch(e => console.error(`sendAbsenceNotification(${id}):`, e))
    }

    return NextResponse.json({ approved: targetIds.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
