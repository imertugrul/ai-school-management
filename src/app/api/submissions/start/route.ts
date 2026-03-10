import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testId } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can start tests' }, { status: 403 })
    }

    // Check if submission already exists
    let submission = await prisma.submission.findUnique({
      where: {
        studentId_testId: {
          studentId: user.id,
          testId
        }
      }
    })

    // If submission doesn't exist, create it
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          testId,
          studentId: user.id,
          status: 'IN_PROGRESS',
          currentQuestionIndex: 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id
    })

  } catch (error: any) {
    console.error('Start submission error:', error)
    return NextResponse.json({ 
      error: 'Failed to start submission' 
    }, { status: 500 })
  }
}
