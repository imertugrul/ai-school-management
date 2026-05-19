import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { validateScheduleSlot } from '@/lib/scheduleValidation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const schedule = await prisma.schedule.findFirst({
      where: { id: params.id, teacherId: user.id },
      include: {
        course: { select: { id: true, code: true, name: true } },
        class:  { select: { id: true, name: true } },
      },
    })
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule bulunamadı.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, schedule })
  } catch (error: any) {
    console.error('Schedule GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const existing = await prisma.schedule.findFirst({
      where: { id: params.id, teacherId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Schedule bulunamadı veya size ait değil.' }, { status: 404 })
    }

    const body = await request.json()
    const { courseId, dayOfWeek, startTime, endTime, room } = body

    // If courseId changes, verify the teacher owns the new assignment and pick its classId
    let classId = existing.classId
    if (courseId && courseId !== existing.courseId) {
      const assignment = await prisma.courseAssignment.findFirst({
        where: { courseId, teacherId: user.id },
      })
      if (!assignment) {
        return NextResponse.json({ error: 'Bu derse atanmamışsınız.' }, { status: 403 })
      }
      classId = assignment.classId
    }

    const validationError = await validateScheduleSlot(
      {
        teacherId: user.id,
        classId,
        dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : existing.dayOfWeek,
        startTime: startTime ?? existing.startTime,
        endTime:   endTime   ?? existing.endTime,
        excludeId: existing.id,
      },
      user.schoolId ?? null,
    )
    if (validationError) {
      const status = validationError.code === 'TEACHER_CONFLICT' || validationError.code === 'CLASS_CONFLICT' ? 409 : 400
      return NextResponse.json({ error: validationError.message, code: validationError.code }, { status })
    }

    const schedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        ...(courseId !== undefined ? { courseId, classId } : {}),
        ...(dayOfWeek !== undefined ? { dayOfWeek: Number(dayOfWeek) } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime   !== undefined ? { endTime } : {}),
        ...(room !== undefined ? { room: room || null } : {}),
      },
      include: { course: true, class: true },
    })

    return NextResponse.json({ success: true, schedule })
  } catch (error: any) {
    console.error('Schedule PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Schedule güncellenemedi.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { count } = await prisma.schedule.deleteMany({
      where: { id: params.id, teacherId: user.id },
    })
    if (count === 0) {
      return NextResponse.json({ error: 'Schedule bulunamadı veya size ait değil.' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Schedule DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
