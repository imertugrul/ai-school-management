import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can view history' }, { status: 403 })
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        markedById: teacher.id
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        class: {
          select: {
            name: true
          }
        },
        notifications: {
          select: {
            type: true,
            message: true,
            sentAt: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      records
    })

  } catch (error: any) {
    console.error('Get history error:', error)
    return NextResponse.json({ 
      error: 'Failed to get history' 
    }, { status: 500 })
  }
}
