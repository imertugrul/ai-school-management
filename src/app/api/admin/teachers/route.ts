import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER'
      },
      include: {
        _count: {
          select: {
            testsCreated: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      teachers
    })
  } catch (error) {
    console.error('Get teachers error:', error)
    return NextResponse.json({ error: 'Failed to get teachers' }, { status: 500 })
  }
}

