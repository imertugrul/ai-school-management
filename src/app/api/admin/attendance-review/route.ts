/**
 * GET /api/admin/attendance-review
 * ?date=2026-03-23&classId=xxx&status=PENDING
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function requireAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, schoolId: true },
  })
  return user?.role === 'ADMIN' ? user : null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await requireAdmin(session.user.email)
    if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const dateStr  = searchParams.get('date')
    const classId  = searchParams.get('classId') || undefined
    const statusQ  = searchParams.get('status') || undefined

    const where: any = {}

    if (dateStr) {
      const start = new Date(dateStr); start.setHours(0, 0, 0, 0)
      const end   = new Date(dateStr); end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }
    if (classId) where.classId = classId
    if (statusQ && statusQ !== 'ALL') where.status = statusQ

    const notifications = await prisma.absenceNotification.findMany({
      where,
      include: {
        student:    { select: { id: true, name: true, guardians: { select: { name: true, email: true, phone: true, receivesEmail: true, receivesSMS: true } } } },
        class:      { select: { id: true, name: true } },
        attendance: { select: { status: true, notes: true } },
        markedBy:   { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Summary counts (today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

    const [pending, approvedToday, corrected] = await Promise.all([
      prisma.absenceNotification.count({ where: { status: 'PENDING' } }),
      prisma.absenceNotification.count({ where: { status: 'APPROVED', reviewedAt: { gte: today, lte: todayEnd } } }),
      prisma.absenceNotification.count({ where: { status: 'CORRECTED', date: { gte: today, lte: todayEnd } } }),
    ])

    return NextResponse.json({ notifications, summary: { pending, approvedToday, corrected } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
