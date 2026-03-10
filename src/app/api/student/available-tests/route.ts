import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        class: true
      }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can view available tests' }, { status: 403 })
    }

    const now = new Date()

    // Get tests assigned to this student
    const assignedTests = await prisma.testAssignment.findMany({
      where: {
        studentId: user.id
      },
      include: {
        test: {
          include: {
            questions: true
          }
        }
      }
    })

    // Get active tests for the student's class
    const classTests = user.classId ? await prisma.test.findMany({
      where: {
        isPublished: true,
        isActive: true,
        startDate: {
          lte: now
        },
        endDate: {
          gte: now
        }
      },
      include: {
        questions: true
      }
    }) : []

    // Combine and deduplicate tests
    const allTests = [...assignedTests.map(at => at.test), ...classTests]
    const uniqueTests = Array.from(new Map(allTests.map(t => [t.id, t])).values())

    // Get submission status for each test
    const availableTests = await Promise.all(
      uniqueTests.map(async (test) => {
        const submission = await prisma.submission.findUnique({
          where: {
            studentId_testId: {
              studentId: user.id,
              testId: test.id
            }
          }
        })

        return {
          id: test.id,
          title: test.title,
          subject: test.subject,
          description: test.description,
          questionCount: test.questions.length,
          startDate: test.startDate,
          endDate: test.endDate,
          status: submission?.status || 'NOT_STARTED',
          submittedAt: submission?.submittedAt,
          totalScore: submission?.totalScore,
          maxScore: submission?.maxScore
        }
      })
    )

    return NextResponse.json({
      success: true,
      tests: availableTests
    })

  } catch (error: any) {
    console.error('Get available tests error:', error)
    return NextResponse.json({ 
      error: 'Failed to get available tests' 
    }, { status: 500 })
  }
}
