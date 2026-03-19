import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { teacherId: user.id, isActive: true },
      include: {
        course: { select: { id: true, code: true, name: true } },
        class:  { select: { id: true, name: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    })

    const totalMinutes = schedules.reduce((sum, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number)
      const [eh, em] = s.endTime.split(':').map(Number)
      return sum + (eh * 60 + em) - (sh * 60 + sm)
    }, 0)

    return NextResponse.json({
      success: true,
      schedules,
      stats: {
        totalClasses: schedules.length,
        uniqueCourses: new Set(schedules.map(s => s.courseId)).size,
        teachingHours: Math.round(totalMinutes / 60 * 10) / 10
      }
    })

  } catch (error: any) {
    console.error('Get schedule error:', error)
    return NextResponse.json({ error: 'Failed to get schedule' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Only delete own schedule entries
    await prisma.schedule.deleteMany({ where: { id, teacherId: user.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
