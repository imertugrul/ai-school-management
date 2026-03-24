/**
 * POST /api/admin/absence-notifications/retry
 * Body: { ids: string[] }
 * Retry FAILED notifications
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { sendAbsenceNotification } from '@/lib/notifications/absenceNotification'

const ALLOWED_ROLES = ['ADMIN', 'VICE_PRINCIPAL']

export async function POST(request: NextRequest) {
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

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    // Verify FAILED + same school
    const notifs = await prisma.absenceNotification.findMany({
      where:  { id: { in: ids }, status: 'FAILED', class: { schoolId: reviewer.schoolId ?? undefined } },
      select: { id: true },
    })
    const validIds = notifs.map(n => n.id)

    // Reset to PENDING before retry
    await prisma.absenceNotification.updateMany({
      where: { id: { in: validIds } },
      data:  { status: 'PENDING', whatsappError: null, emailError: null },
    })

    const results = await Promise.allSettled(validIds.map(id => sendAbsenceNotification(id)))

    const summary = results.reduce(
      (acc, r) => {
        if (r.status === 'fulfilled' && (r.value.whatsappSent || r.value.emailSent)) acc.sent++
        else acc.failed++
        return acc
      },
      { sent: 0, failed: 0, total: validIds.length }
    )

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('absence-notifications retry error:', error)
    return NextResponse.json({ error: 'Failed to retry notifications' }, { status: 500 })
  }
}
