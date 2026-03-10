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
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get tests assigned to this student
    const assignments = await prisma.testAssignment.findMany({
      where: {
        studentId: user.id
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            description: true,
            startDate: true,
            endDate: true,
            isActive: true
          }
        }
      }
    })

    // Filter only active tests and check if already submitted
    const availableTests = []

    for (const assignment of assignments) {
      const test = assignment.test

      // Check if active
      if (!test.isActive) continue

      // Check dates
      const now = new Date()
      if (test.startDate && now < new Date(test.startDate)) continue
      if (test.endDate && now > new Date(test.endDate)) continue

      // Check if already submitted
      const submission = await prisma.submission.findUnique({
        where: {
          testId_studentId: {
            testId: test.id,
            studentId: user.id
          }
        }
      })

      // Only show if not submitted yet
      if (!submission || submission.status === 'IN_PROGRESS') {
        availableTests.push(test)
      }
    }

    return NextResponse.json({
      success: true,
      tests: availableTests
    })

  } catch (error: any) {
    console.error('Get available tests error:', error)
    return NextResponse.json({ error: 'Failed to get tests' }, { status: 500 })
  }
}
