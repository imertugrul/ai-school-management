import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/teacher/gradebook/[courseId]/available-tests
 * Returns COMPLETED tests created by this teacher that are not already
 * linked to a grade component in this course.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Find testIds already linked to this course
    const linked = await prisma.gradeComponent.findMany({
      where: { courseId: params.courseId, testId: { not: null } },
      select: { testId: true },
    })
    const linkedIds = linked.map(l => l.testId!).filter(Boolean)

    // Return all completed tests by this teacher not yet linked
    const tests = await prisma.test.findMany({
      where: {
        createdById: user.id,
        status: 'COMPLETED',
        id: { notIn: linkedIds },
      },
      include: { _count: { select: { submissions: true, questions: true } } },
      orderBy: { endedAt: 'desc' },
    })

    return NextResponse.json({ success: true, tests })
  } catch (error) {
    console.error('Available tests error:', error)
    return NextResponse.json({ error: 'Failed to get available tests' }, { status: 500 })
  }
}
