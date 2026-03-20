import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: { id: params.id, teacherId: teacher.id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } }
      }
    })

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, lessonPlan })
  } catch (error) {
    console.error('Lesson plan GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson plan' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (body.date) {
      body.date = new Date(body.date)
    }

    const lessonPlan = await prisma.lessonPlan.update({
      where: { id: params.id },
      data: body,
      include: {
        course: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ success: true, lessonPlan })
  } catch (error) {
    console.error('Lesson plan PUT error:', error)
    return NextResponse.json({ error: 'Failed to update lesson plan' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.lessonPlan.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lesson plan DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete lesson plan' }, { status: 500 })
  }
}
