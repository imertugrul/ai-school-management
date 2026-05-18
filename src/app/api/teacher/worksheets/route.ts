import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const worksheets = await prisma.worksheet.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        topic: true,
        grade: true,
        curriculum: true,
        language: true,
        types: true,
        createdAt: true,
        lessonPlan: { select: { id: true, title: true, course: { select: { code: true, name: true } }, class: { select: { name: true } } } },
      },
    })

    return NextResponse.json({ success: true, worksheets })
  } catch (error: any) {
    console.error('Worksheets GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch worksheets' }, { status: 500 })
  }
}
