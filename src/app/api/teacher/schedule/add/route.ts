import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { validateScheduleSlot } from '@/lib/scheduleValidation'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { courseId, dayOfWeek, startTime, endTime, room } = await request.json()

    if (!courseId || dayOfWeek === undefined || dayOfWeek === null || !startTime || !endTime) {
      return NextResponse.json({ error: 'courseId, dayOfWeek, startTime ve endTime zorunlu.' }, { status: 400 })
    }

    // Verify the teacher owns this course assignment
    const assignment = await prisma.courseAssignment.findFirst({
      where: { courseId, teacherId: user.id },
      include: { course: true, class: true },
    })
    if (!assignment) {
      return NextResponse.json({ error: 'Bu derse atanmamışsınız.' }, { status: 403 })
    }

    const validationError = await validateScheduleSlot(
      {
        teacherId: user.id,
        classId: assignment.classId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      },
      user.schoolId ?? null,
    )
    if (validationError) {
      const status = validationError.code === 'TEACHER_CONFLICT' || validationError.code === 'CLASS_CONFLICT' ? 409 : 400
      return NextResponse.json({ error: validationError.message, code: validationError.code }, { status })
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        teacherId: user.id,
        classId: assignment.classId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || null,
      },
      include: { course: true, class: true },
    })

    return NextResponse.json({ success: true, schedule })

  } catch (error: any) {
    console.error('Add schedule error:', error)
    return NextResponse.json({ error: error.message || 'Schedule eklenemedi.' }, { status: 500 })
  }
}
