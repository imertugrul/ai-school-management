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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const tests = await prisma.test.findMany({
      where: {
        createdBy: {
          schoolId: user.schoolId
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            questions: true
          }
        },
        submissions: {
          select: {
            status: true,
            totalScore: true,
            maxScore: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const result = tests.map((test) => {
      const submittedSubmissions = test.submissions.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'GRADED' || s.status === 'RELEASED'
      )

      const scoresWithData = submittedSubmissions.filter(
        (s) => s.totalScore !== null && s.maxScore !== null && s.maxScore > 0
      )

      const avgScore =
        scoresWithData.length > 0
          ? scoresWithData.reduce((sum, s) => {
              return sum + ((s.totalScore! / s.maxScore!) * 100)
            }, 0) / scoresWithData.length
          : null

      return {
        id: test.id,
        title: test.title,
        subject: test.subject,
        isActive: test.isActive,
        accessCode: test.accessCode,
        createdAt: test.createdAt,
        teacher: {
          id: test.createdBy.id,
          name: test.createdBy.name
        },
        questionsCount: test._count.questions,
        submittedCount: submittedSubmissions.length,
        avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null
      }
    })

    return NextResponse.json({ success: true, tests: result })
  } catch (error: unknown) {
    console.error('Get tests error:', error)
    return NextResponse.json({ error: 'Failed to get tests' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    // Verify teacher belongs to the same school
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { schoolId: true }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (test.createdBy.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Not authorized to delete this test' }, { status: 403 })
    }

    await prisma.test.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Test deleted' })
  } catch (error: unknown) {
    console.error('Delete test error:', error)
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
  }
}
