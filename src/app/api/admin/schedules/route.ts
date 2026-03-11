import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - List all schedules
export async function GET(request: NextRequest) {
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

    const schedules = await prisma.schedule.findMany({
      include: {
        course: true,
        teacher: {
          select: { id: true, name: true, email: true }
        },
        class: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ success: true, schedules })

  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json({ 
      error: 'Failed to get schedules' 
    }, { status: 500 })
  }
}

// POST - Create new schedule
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

    // Check for conflicts
    const conflict = await prisma.schedule.findFirst({
      where: {
        OR: [
          // Teacher conflict
          {
            teacherId,
            dayOfWeek: parseInt(dayOfWeek),
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              }
            ]
          },
          // Class conflict (if class specified)
          classId ? {
            classId,
            dayOfWeek: parseInt(dayOfWeek),
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              }
            ]
          } : {}
        ]
      }
    })

    if (conflict) {
      return NextResponse.json({ 
        error: 'Schedule conflict detected' 
      }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        teacherId,
        classId: classId || null,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        room
      },
      include: {
        course: true,
        teacher: {
          select: { name: true }
        },
        class: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ success: true, schedule })

  } catch (error: any) {
    console.error('Create schedule error:', error)
    return NextResponse.json({ 
      error: 'Failed to create schedule' 
    }, { status: 500 })
  }
}
