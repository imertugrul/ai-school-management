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
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        lastActiveAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      submissions
    })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json({ error: 'Failed to get submissions' }, { status: 500 })
  }
}
