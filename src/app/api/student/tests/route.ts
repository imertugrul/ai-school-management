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

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    const assignments = await prisma.testAssignment.findMany({
      where: { studentId: user.id },
      include: {
        test: {
          include: {
            _count: { select: { questions: true } }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    // Attach submission status for each test
    const submissions = await prisma.submission.findMany({
      where: { studentId: user.id },
      select: {
        id: true,
        testId: true,
        status: true,
        totalScore: true,
        maxScore: true,
        submittedAt: true
      }
    })

    const submissionMap = new Map(submissions.map(s => [s.testId, s]))

    const tests = assignments.map(a => ({
      ...a.test,
      assignedAt: a.assignedAt,
      submission: submissionMap.get(a.test.id) || null
    }))

    return NextResponse.json({ success: true, tests })

  } catch (error: any) {
    console.error('Get student tests error:', error)
    return NextResponse.json({ error: 'Failed to get tests' }, { status: 500 })
  }
}
