import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        test: {
          select: {
            title: true,
            subject: true
          }
        },
        answers: {
          include: {
            question: {
              select: {
                content: true,
                points: true,
                type: true
              }
            }
          },
          orderBy: {
            question: {
              orderIndex: 'asc'
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify this is the student's own submission
    if (submission.studentId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only show results if graded
    if (submission.status !== 'RELEASED') {
      return NextResponse.json({ 
        error: 'Results not available yet. Please wait for grading.' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      submission
    })

  } catch (error: any) {
    console.error('Get student results error:', error)
    return NextResponse.json({ 
      error: 'Failed to get results' 
    }, { status: 500 })
  }
}
