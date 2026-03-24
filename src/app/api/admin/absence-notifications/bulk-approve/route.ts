/**
 * POST /api/admin/absence-notifications/bulk-approve
 * Body: { ids: string[] }
 * Approve and send multiple PENDING notifications
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

    // Verify all belong to reviewer's school and are PENDING
    const notifs = await prisma.absenceNotification.findMany({
      where:   { id: { in: ids }, status: 'PENDING', class: { schoolId: reviewer.schoolId ?? undefined } },
      select:  { id: true },
    })

    const validIds = notifs.map(n => n.id)

    // Mark reviewer on all
    await prisma.absenceNotification.updateMany({
      where: { id: { in: validIds } },
      data:  { reviewedById: reviewer.id, reviewedAt: new Date() },
    })

    // Send in parallel
    const results = await Promise.allSettled(validIds.map(id => sendAbsenceNotification(id)))

    const summary = results.reduce(
      (acc, r, i) => {
        if (r.status === 'fulfilled') {
          if (r.value.whatsappSent || r.value.emailSent) acc.sent++
          else acc.failed++
        } else {
          acc.failed++
        }
        return acc
      },
      { sent: 0, failed: 0, total: validIds.length, skipped: ids.length - validIds.length }
    )

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('absence-notifications bulk-approve error:', error)
    return NextResponse.json({ error: 'Failed to bulk approve' }, { status: 500 })
  }
}
