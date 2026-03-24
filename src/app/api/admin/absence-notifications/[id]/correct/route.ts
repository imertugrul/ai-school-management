/**
 * PUT /api/admin/absence-notifications/[id]/correct
 * Correct attendance status and mark notification as CORRECTED
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['ADMIN', 'VICE_PRINCIPAL']

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reviewer = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!reviewer || !ALLOWED_ROLES.includes(reviewer.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const notif = await prisma.absenceNotification.findUnique({
      where:   { id: params.id },
      include: { class: { select: { schoolId: true } } },
    })
    if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (notif.class.schoolId !== reviewer.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { correctedTo, reviewNote } = body
    if (!correctedTo) return NextResponse.json({ error: 'correctedTo is required' }, { status: 400 })

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']
    if (!validStatuses.includes(correctedTo)) {
      return NextResponse.json({ error: `correctedTo must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    // Update attendance record
    await prisma.attendanceRecord.update({
      where: { id: notif.attendanceId },
      data:  { status: correctedTo },
    })

    // Mark notification as corrected
    const updated = await prisma.absenceNotification.update({
      where: { id: params.id },
      data: {
        status:       'CORRECTED',
        correctedTo,
        originalStatus: notif.correctedTo ?? undefined,
        reviewedById: reviewer.id,
        reviewedAt:   new Date(),
        reviewNote:   reviewNote ?? null,
      },
    })

    return NextResponse.json({ success: true, notification: updated })
  } catch (error) {
    console.error('absence-notifications correct error:', error)
    return NextResponse.json({ error: 'Failed to correct notification' }, { status: 500 })
  }
}
