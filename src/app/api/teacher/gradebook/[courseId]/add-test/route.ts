import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/teacher/gradebook/[courseId]/add-test
 * Body: { testId, name, weight, type }
 *
 * Creates a GradeComponent linked to the test, then auto-fills grades
 * from existing submissions for students enrolled in this course.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { testId, name, weight, type } = await request.json()
    if (!testId || !name || weight == null) {
      return NextResponse.json({ error: 'testId, name, weight required' }, { status: 400 })
    }

    // Verify teacher owns the test
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: { select: { points: true } },
        submissions: {
          where: { status: { in: ['SUBMITTED', 'GRADED', 'RELEASED'] } },
          select: { studentId: true, totalScore: true, maxScore: true },
        },
      },
    })
    if (!test || test.createdById !== user.id) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const maxScore = test.questions.reduce((s, q) => s + q.points, 0) || 100

    // Create the grade component
    const component = await prisma.gradeComponent.create({
      data: {
        courseId: params.courseId,
        name,
        type: type || 'EXAM',
        weight: parseFloat(weight) / 100,
        maxScore,
        testId,
        date: test.endedAt ?? test.endDate ?? null,
      },
    })

    // Get enrolled students for this course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: params.courseId, status: 'ACTIVE' },
      select: { studentId: true },
    })
    const enrolledIds = new Set(enrollments.map(e => e.studentId))

    // Auto-fill grades from submissions
    const submissionMap = new Map(test.submissions.map(s => [s.studentId, s]))
    let filledCount = 0

    for (const studentId of enrolledIds) {
      const sub = submissionMap.get(studentId)
      if (!sub || sub.totalScore == null) continue

      const score = sub.maxScore && sub.maxScore > 0
        ? (sub.totalScore / sub.maxScore) * maxScore
        : sub.totalScore

      await prisma.grade.upsert({
        where: { componentId_studentId: { componentId: component.id, studentId } },
        create: { componentId: component.id, studentId, score: Math.round(score * 10) / 10 },
        update: { score: Math.round(score * 10) / 10 },
      })
      filledCount++
    }

    return NextResponse.json({ success: true, component, filledCount })
  } catch (error) {
    console.error('Add test to gradebook error:', error)
    return NextResponse.json({ error: 'Failed to add test' }, { status: 500 })
  }
}
