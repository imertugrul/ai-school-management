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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const worksheet = await prisma.worksheet.findFirst({
      where: { id: params.id, teacherId: teacher.id },
      include: {
        lessonPlan: { select: { id: true, title: true, unitName: true, curriculumType: true, course: { select: { code: true, name: true, grade: true } }, class: { select: { name: true } } } },
      },
    })

    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet bulunamadı.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, worksheet })
  } catch (error: any) {
    console.error('Worksheet GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch worksheet' }, { status: 500 })
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

    const teacher = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const worksheet = await prisma.worksheet.findFirst({
      where: { id: params.id, teacherId: teacher.id },
      select: { id: true },
    })
    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet bulunamadı.' }, { status: 404 })
    }

    await prisma.worksheet.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Worksheet DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete worksheet' }, { status: 500 })
  }
}
