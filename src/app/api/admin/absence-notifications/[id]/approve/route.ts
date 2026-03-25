/**
 * POST /api/admin/absence-notifications/[id]/approve
 * Approve and send notification to guardians
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/apiError'
import { sendAbsenceNotification } from '@/lib/notifications/absenceNotification'

const ALLOWED_ROLES = ['ADMIN', 'VICE_PRINCIPAL']

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    if (notif.status !== 'PENDING') {
      return NextResponse.json({ error: `Notification is already ${notif.status}` }, { status: 400 })
    }

    // Mark reviewer + fire delivery
    await prisma.absenceNotification.update({
      where: { id: params.id },
      data:  { reviewedById: reviewer.id, reviewedAt: new Date() },
    })

    const result = await sendAbsenceNotification(params.id)
    const updated = await prisma.absenceNotification.findUnique({ where: { id: params.id } })

    return NextResponse.json({ success: true, notification: updated, delivery: result })
  } catch (error) {
    return handleApiError(error, 'admin/absence-notifications/approve')
  }
}
