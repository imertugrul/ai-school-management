import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

function getMonday(d: Date): string {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const weekStartParam = searchParams.get('weekStart') ?? getMonday(new Date())

    const weekStart = new Date(weekStartParam + 'T00:00:00')
    const weekEnd = new Date(weekStartParam + 'T00:00:00')
    weekEnd.setDate(weekEnd.getDate() + 4)
    weekEnd.setHours(23, 59, 59, 999)

    // Schema: 0=Mon ... 4=Fri
    const schedules = await prisma.schedule.findMany({
      where: { teacherId: user.id, isActive: true, dayOfWeek: { in: [0, 1, 2, 3, 4] } },
      include: {
        course: { select: { id: true, name: true, code: true } },
        class: {
          select: {
            id: true,
            name: true,
            _count: { select: { students: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    const classIds = schedules.filter(s => s.classId).map(s => s.classId!)

    const allRecords = classIds.length > 0
      ? await prisma.attendanceRecord.findMany({
          where: { classId: { in: classIds }, date: { gte: weekStart, lte: weekEnd } },
          select: { studentId: true, classId: true, status: true, date: true },
        })
      : []

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const days = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const daySchedules = schedules.filter(s => s.dayOfWeek === i)

      return {
        date: dateStr,
        dayOfWeek: i,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        schedules: daySchedules.map(s => {
          const classRecords = allRecords.filter(r => {
            const rDate = r.date.toISOString().split('T')[0]
            return r.classId === s.classId && rDate === dateStr
          })
          const recorded = classRecords.length > 0

          let todayStatus: 'UPCOMING' | 'ACTIVE' | 'PAST' | null = null
          if (dateStr === todayStr) {
            const [sh, sm] = s.startTime.split(':').map(Number)
            const [eh, em] = s.endTime.split(':').map(Number)
            const nowMins = now.getHours() * 60 + now.getMinutes()
            if (nowMins < sh * 60 + sm) todayStatus = 'UPCOMING'
            else if (nowMins < eh * 60 + em) todayStatus = 'ACTIVE'
            else todayStatus = 'PAST'
          }

          return {
            scheduleId: s.id,
            courseName: s.course.name,
            courseCode: s.course.code,
            className: s.class?.name ?? null,
            startTime: s.startTime,
            endTime: s.endTime,
            totalStudents: s.class?._count.students ?? 0,
            recorded,
            presentCount: classRecords.filter(r => r.status === 'PRESENT').length,
            absentCount: classRecords.filter(r => r.status === 'ABSENT').length,
            lateCount: classRecords.filter(r => r.status === 'LATE').length,
            todayStatus,
          }
        }),
      }
    })

    return NextResponse.json({ success: true, weekStart: weekStartParam, days })
  } catch (error: any) {
    console.error('Weekly attendance error:', error)
    return NextResponse.json({ error: 'Failed to get weekly data' }, { status: 500 })
  }
}
