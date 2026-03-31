import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        testAssignments: {
          include: { student: { select: { id: true, name: true, email: true } } }
        }
      }
    })
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    if (test.createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get all submissions with suspicious activities
    const submissions = await prisma.submission.findMany({
      where: { testId: params.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        suspiciousActivities: true,
      },
      orderBy: { lastActiveAt: 'desc' }
    })

    const submissionMap = new Map(submissions.map(s => [s.studentId, s]))

    // Build per-student data
    const studentData = test.testAssignments.map(assignment => {
      const sub = submissionMap.get(assignment.studentId)
      const violations = sub?.suspiciousActivities ?? []
      const tabSwitches = violations.filter(v => v.type === 'TAB_SWITCH').length
      const windowBlurs = violations.filter(v => v.type === 'WINDOW_BLUR').length
      const copyPastes = violations.filter(v => v.type === 'COPY_PASTE').length
      const totalViolations = violations.length

      return {
        studentId: assignment.studentId,
        studentName: assignment.student.name,
        studentEmail: assignment.student.email,
        status: !sub ? 'not_started' : sub.status === 'SUBMITTED' || sub.status === 'GRADED' ? 'submitted' : 'in_progress',
        currentQuestion: sub?.currentQuestionIndex ?? 0,
        totalQuestions: test.testAssignments.length > 0 ? undefined : 0,
        lastActiveAt: sub?.lastActiveAt ?? null,
        submittedAt: sub?.submittedAt ?? null,
        totalViolations,
        tabSwitches,
        windowBlurs,
        copyPastes,
      }
    })

    const total = studentData.length
    const submitted = studentData.filter(s => s.status === 'submitted').length
    const inProgress = studentData.filter(s => s.status === 'in_progress').length
    const notStarted = studentData.filter(s => s.status === 'not_started').length
    const suspicious = studentData.filter(s => s.totalViolations > 0).length

    return NextResponse.json({
      success: true,
      test: { id: test.id, title: test.title, questionCount: 0 },
      students: studentData,
      stats: { total, submitted, inProgress, notStarted, suspicious }
    })
  } catch (error) {
    console.error('Live monitor error:', error)
    return NextResponse.json({ error: 'Failed to get live data' }, { status: 500 })
  }
}
