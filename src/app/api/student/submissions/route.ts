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

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: user.id
      },
      include: {
        test: {
          select: {
            title: true,
            subject: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      submissions
    })
  } catch (error) {
    console.error('Get student submissions error:', error)
    return NextResponse.json({ error: 'Failed to get submissions' }, { status: 500 })
  }
}

