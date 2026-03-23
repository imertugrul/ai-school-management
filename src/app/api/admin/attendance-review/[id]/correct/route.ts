/**
 * PUT /api/admin/attendance-review/[id]/correct
 * { correctedTo: 'PRESENT' | 'LATE' | 'EXCUSED', reviewNote?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

type Ctx = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { correctedTo, reviewNote } = await request.json()
    if (!correctedTo || !['PRESENT', 'LATE', 'EXCUSED'].includes(correctedTo)) {
      return NextResponse.json({ error: 'correctedTo must be PRESENT, LATE, or EXCUSED' }, { status: 400 })
    }

    const notif = await prisma.absenceNotification.findUnique({
      where: { id: params.id },
      include: { attendance: { select: { status: true } } },
    })
    if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (notif.status === 'SENT') {
      return NextResponse.json({ error: 'Gönderilmiş bildirim düzeltilemez' }, { status: 400 })
    }

    const originalStatus = notif.attendance.status as string

    // Update AttendanceRecord
    await prisma.attendanceRecord.update({
      where: { id: notif.attendanceId },
      data: { status: correctedTo as any },
    })

    // Mark notification as CORRECTED (no message sent)
    const updated = await prisma.absenceNotification.update({
      where: { id: params.id },
      data: {
        status: 'CORRECTED',
        correctedTo,
        originalStatus,
        reviewNote:    reviewNote ?? null,
        reviewedById:  admin.id,
        reviewedAt:    new Date(),
      },
    })

    return NextResponse.json({ notification: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
