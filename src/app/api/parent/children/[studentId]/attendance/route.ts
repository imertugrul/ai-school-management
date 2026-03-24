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

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
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

    const monthParam = req.nextUrl.searchParams.get('month') // "2026-03"
    let year: number, month: number
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number)
      year = y; month = m - 1
    } else {
      const now = new Date()
      year = now.getFullYear(); month = now.getMonth()
    }
    const start = new Date(year, month, 1)
    const end   = new Date(year, month + 1, 0, 23, 59, 59)

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: params.studentId, date: { gte: start, lte: end } },
      include: {
        absenceNotification: { select: { status: true, whatsappSent: true, emailSent: true } },
      },
      orderBy: { date: 'asc' },
    })

    const summary = {
      present: records.filter(r => r.status === 'PRESENT').length,
      absent:  records.filter(r => r.status === 'ABSENT').length,
      late:    records.filter(r => r.status === 'LATE').length,
      excused: records.filter(r => r.status === 'EXCUSED').length,
    }

    return NextResponse.json({
      records: records.map(r => ({
        id:     r.id,
        date:   r.date,
        status: r.status,
        notes:  r.notes,
        notification: r.absenceNotification
          ? {
              status:       r.absenceNotification.status,
              whatsappSent: r.absenceNotification.whatsappSent,
              emailSent:    r.absenceNotification.emailSent,
            }
          : null,
      })),
      summary,
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
    })
  } catch (error) {
    console.error('parent attendance error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
