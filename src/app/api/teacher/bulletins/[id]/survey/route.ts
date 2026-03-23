/**
 * PUT /api/teacher/bulletins/[id]/survey
 * Save teacher survey answers and mark bulletin as READY
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

type Ctx = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bulletin = await prisma.performanceBulletin.findUnique({
      where: { id: params.id },
    })
    if (!bulletin || bulletin.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 })
    }
    if (bulletin.status === 'SENT') {
      return NextResponse.json({ error: 'Bu bülten zaten gönderilmiş' }, { status: 400 })
    }

    const {
      participationRating,
      behaviorRating,
      homeworkRating,
      strengthAreas,
      improvementAreas,
      teacherComment,
    } = await request.json()

    const updated = await prisma.performanceBulletin.update({
      where: { id: params.id },
      data: {
        participationRating: participationRating ?? null,
        behaviorRating:      behaviorRating      ?? null,
        homeworkRating:      homeworkRating       ?? null,
        strengthAreas:       strengthAreas        ?? null,
        improvementAreas:    improvementAreas     ?? null,
        teacherComment:      teacherComment       ?? null,
        status: 'READY',
      },
      include: { student: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ bulletin: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
