import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { courseId, dayOfWeek, startTime, endTime, room } = await request.json()

    // Get course assignment to verify teacher owns this course
    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        courseId,
        teacherId: user.id
      },
      include: {
        course: true,
        class: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: 'You are not assigned to this course' 
      }, { status: 403 })
    }

    // CONFLICT CHECK 1: Teacher cannot be in two places at same time
    const teacherConflict = await prisma.schedule.findFirst({
      where: {
        teacherId: user.id,
        dayOfWeek,
        startTime
      }
    })

    if (teacherConflict) {
      return NextResponse.json({ 
        error: `You already have a class at ${startTime} on this day` 
      }, { status: 400 })
    }

    // CONFLICT CHECK 2: Class cannot have two courses at same time
    if (assignment.classId) {
      const classConflict = await prisma.schedule.findFirst({
        where: {
          classId: assignment.classId,
          dayOfWeek,
          startTime
        }
      })

      if (classConflict) {
        return NextResponse.json({ 
          error: `This class already has a course at ${startTime} on this day` 
        }, { status: 400 })
      }
    }

    // Create schedule entry
    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        teacherId: user.id,
        classId: assignment.classId,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null
      },
      include: {
        course: true,
        class: true
      }
    })

    return NextResponse.json({ success: true, schedule })

  } catch (error: any) {
    console.error('Add schedule error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to add schedule entry' 
    }, { status: 500 })
  }
}
