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

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month') // format: "YYYY-MM"

    let dateFilter = {}
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0, 23, 59, 59)
      dateFilter = {
        date: { gte: startOfMonth, lte: endOfMonth }
      }
    }

    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: teacher.id,
        ...dateFilter
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ success: true, lessonPlans })
  } catch (error) {
    console.error('Lesson plans GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId, classId, title, date, duration, objectives, materials, activities, assessment, homework, notes } = body

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        teacherId: teacher.id,
        courseId,
        classId: classId || null,
        title,
        date: new Date(date),
        duration: duration || 45,
        objectives,
        materials: materials || null,
        activities,
        assessment: assessment || null,
        homework: homework || null,
        notes: notes || null
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ success: true, lessonPlan })
  } catch (error) {
    console.error('Lesson plan POST error:', error)
    return NextResponse.json({ error: 'Failed to create lesson plan' }, { status: 500 })
  }
}
