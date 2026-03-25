import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

type ScheduleStatus = 'UPCOMING' | 'ACTIVE' | 'PAST'

function computeStatus(startTime: string, endTime: string, now: Date): ScheduleStatus {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  if (nowMins < startMins) return 'UPCOMING'
  if (nowMins < endMins) return 'ACTIVE'
  return 'PAST'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

    // JS getDay(): 0=Sun → schema: 0=Mon
    const date = new Date(dateParam + 'T12:00:00')
    const jsDay = date.getDay()
    const schemaDay = jsDay === 0 ? 6 : jsDay - 1

    const now = new Date()

    const schedules = await prisma.schedule.findMany({
      where: { teacherId: user.id, isActive: true, dayOfWeek: schemaDay },
      include: {
        course: { select: { id: true, name: true, code: true } },
        class: {
          select: {
            id: true,
            name: true,
            students: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    const classIds = schedules.filter(s => s.classId).map(s => s.classId!)

    const startOfDay = new Date(dateParam + 'T00:00:00')
    const endOfDay = new Date(dateParam + 'T23:59:59')

    const existingRecords = classIds.length > 0
      ? await prisma.attendanceRecord.findMany({
          where: { classId: { in: classIds }, date: { gte: startOfDay, lte: endOfDay } },
          select: { studentId: true, classId: true, status: true, notes: true },
        })
      : []

    const result = schedules.map(s => {
      const status = computeStatus(s.startTime, s.endTime, now)
      const classAttendance = s.classId
        ? existingRecords.filter(r => r.classId === s.classId)
        : []

      const [eh, em] = s.endTime.split(':').map(Number)
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const isLateEntry = nowMins > eh * 60 + em + 30

      return {
        id: s.id,
        courseId: s.courseId,
        courseName: s.course.name,
        courseCode: s.course.code,
        classId: s.classId,
        className: s.class?.name ?? null,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        students: (s.class?.students ?? []).map(st => ({ id: st.id, name: st.name })),
        status,
        isLateEntry,
        existingAttendance: classAttendance.length > 0
          ? classAttendance.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes }))
          : null,
      }
    })

    return NextResponse.json({ success: true, date: dateParam, dayOfWeek: schemaDay, schedules: result })
  } catch (error: any) {
    console.error('Schedule attendance error:', error)
    return NextResponse.json({ error: 'Failed to get schedule' }, { status: 500 })
  }
}
