import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function verifyParentAccess(parentUserId: string, studentId: string) {
  const guardian = await prisma.guardian.findFirst({ where: { studentId, userId: parentUserId } })
  if (guardian) return true
  const link = await prisma.parentStudent.findFirst({ where: { parentId: parentUserId, studentId } })
  return !!link
}

export async function GET(_req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user || !['PARENT', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role !== 'ADMIN') {
      const ok = await verifyParentAccess(user.id, params.studentId)
      if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const student = await prisma.user.findUnique({
      where: { id: params.studentId },
      select: { id: true, name: true, classId: true, schoolId: true, class: { select: { name: true } }, school: { select: { name: true } } },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Grade average
    const grades = await prisma.grade.findMany({
      where: { studentId: params.studentId },
      include: { component: { select: { weight: true, maxScore: true, courseId: true, course: { select: { name: true } } } } },
    })
    let weightedSum = 0, totalWeight = 0
    for (const g of grades) {
      const pct = (g.score / g.component.maxScore) * 100
      weightedSum += pct * g.component.weight
      totalWeight += g.component.weight
    }
    const gradeAverage = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null

    // Attendance this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const attendance = await prisma.attendanceRecord.findMany({
      where: { studentId: params.studentId, date: { gte: monthStart, lte: monthEnd } },
      select: { status: true },
    })
    const attendanceSummary = {
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent:  attendance.filter(a => a.status === 'ABSENT').length,
      late:    attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
    }

    // Upcoming tests
    const upcomingTests = await prisma.testAssignment.findMany({
      where: {
        studentId: params.studentId,
        test: { endDate: { gt: now } },
      },
      include: { test: { select: { title: true, endDate: true, subject: true } } },
      orderBy: { test: { endDate: 'asc' } },
      take: 3,
    })

    // Recent activity (last 5 absence notifications)
    const recentAbsences = await prisma.absenceNotification.findMany({
      where: { studentId: params.studentId },
      include: { attendance: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Recent bulletins
    const recentBulletins = await prisma.performanceBulletin.findMany({
      where: { studentId: params.studentId, status: 'SENT' },
      orderBy: { sentAt: 'desc' },
      take: 2,
    })

    // Recent announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId: student.schoolId ?? undefined,
        AND: [
          { OR: [{ targetRoles: { isEmpty: true } }, { targetRoles: { has: 'PARENT' } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 3,
      select: { id: true, title: true, content: true, publishedAt: true, isPinned: true, priority: true },
    })

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        className: student.class?.name ?? '',
        schoolName: student.school?.name ?? '',
      },
      gradeAverage,
      attendanceSummary,
      upcomingTests: upcomingTests.map(t => ({
        id: t.id,
        title: t.test.title,
        subject: t.test.subject,
        dueDate: t.test.endDate,
      })),
      recentAbsences: recentAbsences.map(a => ({
        id: a.id,
        date: a.date,
        status: a.attendance.status,
        notifStatus: a.status,
      })),
      recentBulletins: recentBulletins.map(b => ({
        id: b.id,
        month: b.month,
        sentAt: b.sentAt,
        gradeAverage: b.gradeAverage,
      })),
      announcements,
    })
  } catch (error) {
    console.error('parent dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
