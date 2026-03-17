import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        course: {
          schoolId: user.schoolId
        }
      },
      include: {
        course: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      schedules
    })

  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json({ 
      error: 'Failed to get schedules' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { courseId, teacherId, classId, dayOfWeek, startTime, endTime, room } = await request.json()

    // Check for duplicate schedule
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        courseId,
        teacherId,
        classId: classId || null,
        dayOfWeek,
        startTime,
        endTime
      }
    })

    if (existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule already exists for this slot',
        duplicate: true
      }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        teacherId,
        classId: classId || null,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null
      },
      include: {
        course: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: true
      }
    })

    return NextResponse.json({ success: true, schedule })

  } catch (error: any) {
    console.error('Create schedule error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create schedule' 
    }, { status: 500 })
  }
}