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

    const submissions = await prisma.submission.findMany({
      where: {
        testId: params.id
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
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
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      submissions
    })

  } catch (error: any) {
    console.error('Get results error:', error)
    return NextResponse.json({ 
      error: 'Failed to get results' 
    }, { status: 500 })
  }
}
