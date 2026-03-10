import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        test: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Calculate max score
    const maxScore = submission.test.questions.reduce((sum, q) => sum + q.points, 0)

    // Update submission to SUBMITTED (NOT graded yet)
    await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        maxScore
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Test submitted successfully! Your teacher will grade it soon.'
    })

  } catch (error: any) {
    console.error('Submit error:', error)
    return NextResponse.json({ 
      error: 'Failed to submit test' 
    }, { status: 500 })
  }
}