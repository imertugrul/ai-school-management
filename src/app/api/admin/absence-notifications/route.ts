/**
 * GET /api/admin/absence-notifications
 * Query params: date, classId, status
 * Returns filtered list + summary counts
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['ADMIN', 'VICE_PRINCIPAL']

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam    = searchParams.get('date')
    const classIdParam = searchParams.get('classId')
    const statusParam  = searchParams.get('status')

    const where: Record<string, unknown> = {
      class: { schoolId: user.schoolId ?? undefined },
    }

    if (dateParam) {
      const day   = new Date(dateParam)
      const start = new Date(day); start.setHours(0, 0, 0, 0)
      const end   = new Date(day); end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }
    if (classIdParam) where.classId = classIdParam
    if (statusParam)  where.status  = statusParam

    const notifications = await prisma.absenceNotification.findMany({
      where,
      include: {
        student:    { select: { id: true, name: true } },
        class:      { select: { id: true, name: true } },
        markedBy:   { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        attendance: { select: { status: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    // Summary counts
    const allForSchool = await prisma.absenceNotification.groupBy({
      by:    ['status'],
      where: { class: { schoolId: user.schoolId ?? undefined } },
      _count: { status: true },
    })
    const summary = { pending: 0, approved: 0, corrected: 0, failed: 0 }
    for (const row of allForSchool) {
      const s = row.status.toLowerCase() as keyof typeof summary
      if (s in summary) summary[s] = row._count.status
    }

    return NextResponse.json({ success: true, notifications, summary })
  } catch (error) {
    console.error('absence-notifications GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
