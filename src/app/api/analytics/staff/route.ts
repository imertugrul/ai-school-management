/**
 * GET /api/analytics/staff
 * Query: ?month=2026-03&classId=
 * Returns attendance-focused analytics for staff
 * Auth: ADMIN, VICE_PRINCIPAL
 */
export const revalidate = 300

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const ALLOWED = ['ADMIN', 'VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY']

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!user || !ALLOWED.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const classId    = searchParams.get('classId') || null
    const monthParam = searchParams.get('month')   || null

    let dateStart: Date
    let dateEnd: Date
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number)
      dateStart = new Date(y, m - 1, 1)
      dateEnd   = new Date(y, m, 0, 23, 59, 59)
    } else {
      const now = new Date()
      dateStart = new Date(now.getFullYear(), now.getMonth(), 1)
      dateEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const baseWhere = {
      class: { schoolId: user.schoolId ?? undefined },
      ...(classId ? { classId } : {}),
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    const thisMonthWhere = { ...baseWhere, date: { gte: dateStart, lte: dateEnd } }

    const absenceCounts = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: thisMonthWhere as any,
      _count: { status: true },
    })
    const absMap: Record<string, number> = {}
    for (const r of absenceCounts) absMap[r.status] = r._count.status
    const totalAbsent = absMap['ABSENT'] ?? 0
    const totalLate   = absMap['LATE']   ?? 0

    // Worst class (most absences)
    const byClassRaw = await prisma.attendanceRecord.groupBy({
      by: ['classId'],
      where: { ...thisMonthWhere, status: 'ABSENT' } as any,
      _count: { classId: true },
      orderBy: { _count: { classId: 'desc' } },
      take: 1,
    })
    let worstClass = ''
    if (byClassRaw.length > 0) {
      const cls = await prisma.class.findUnique({ where: { id: byClassRaw[0].classId }, select: { name: true } })
      worstClass = cls?.name ?? ''
    }

    // Notification counts
    const notifWhere = {
      class: { schoolId: user.schoolId ?? undefined },
      ...(classId ? { classId } : {}),
      createdAt: { gte: dateStart, lte: dateEnd },
    }
    const [notified, pending] = await Promise.all([
      prisma.absenceNotification.count({ where: { ...notifWhere, status: 'APPROVED' } as any }),
      prisma.absenceNotification.count({ where: { ...notifWhere, status: 'PENDING' } as any }),
    ])

    // ── Trend (last 6 months) ────────────────────────────────────────────────
    const now = new Date()
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ms = new Date(d.getFullYear(), d.getMonth(), 1)
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const rows = await prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { class: { schoolId: user.schoolId ?? undefined }, ...(classId ? { classId } : {}), date: { gte: ms, lte: me } },
        _count: { status: true },
      })
      const m: Record<string, number> = {}
      for (const r of rows) m[r.status] = r._count.status
      trend.push({
        month: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
        absent:  m['ABSENT']  ?? 0,
        late:    m['LATE']    ?? 0,
        present: m['PRESENT'] ?? 0,
      })
    }

    // ── By-class this month ─────────────────────────────────────────────────
    const classAbsRaw = await prisma.attendanceRecord.groupBy({
      by: ['classId'],
      where: { ...thisMonthWhere, status: { in: ['ABSENT', 'LATE'] } } as any,
      _count: { classId: true },
      orderBy: { _count: { classId: 'desc' } },
    })
    const classData = await Promise.all(classAbsRaw.slice(0, 10).map(async row => {
      const cls = await prisma.class.findUnique({ where: { id: row.classId }, select: { name: true } })
      const total = await prisma.attendanceRecord.count({ where: { classId: row.classId, date: { gte: dateStart, lte: dateEnd } } })
      return { class: cls?.name ?? row.classId, absences: row._count.classId, total, rate: total > 0 ? Math.round((row._count.classId / total) * 1000) / 10 : 0 }
    }))

    // ── Chronic absentees (3+ days) ─────────────────────────────────────────
    const chronicRaw = await prisma.attendanceRecord.groupBy({
      by: ['studentId'],
      where: { ...thisMonthWhere, status: 'ABSENT' } as any,
      _count: { studentId: true },
      having: { studentId: { _count: { gte: 3 } } },
      orderBy: { _count: { studentId: 'desc' } },
      take: 20,
    })
    const chronic = await Promise.all(chronicRaw.map(async row => {
      const student  = await prisma.user.findUnique({ where: { id: row.studentId }, select: { name: true, class: { select: { name: true } } } })
      const notified = await prisma.absenceNotification.count({
        where: { studentId: row.studentId, status: { in: ['APPROVED'] }, createdAt: { gte: dateStart, lte: dateEnd } },
      })
      return { student: student?.name ?? '', class: student?.class?.name ?? '', days: row._count.studentId, notified: notified > 0 }
    }))

    // Available classes for filter
    const allClasses = await prisma.class.findMany({
      where: { schoolId: user.schoolId ?? undefined },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      summary: { totalAbsent, totalLate, worstClass, notified, pending },
      trend,
      byClass: classData,
      chronicAbsent: chronic,
      classes: allClasses,
    })
  } catch (error) {
    console.error('analytics/staff error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
