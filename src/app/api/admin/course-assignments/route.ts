import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - List all course assignments
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

    const assignments = await prisma.courseAssignment.findMany({
      include: {
        course: true,
        teacher: {
          select: { id: true, name: true, email: true }
        },
        class: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, assignments })

  } catch (error: any) {
    console.error('Get course assignments error:', error)
    return NextResponse.json({ 
      error: 'Failed to get course assignments' 
    }, { status: 500 })
  }
}

// POST - Create course assignment
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

    const { courseId, teacherId, classId, weeklyHours, preferences } = await request.json()

    // Check if assignment already exists
    const existing = await prisma.courseAssignment.findUnique({
      where: {
        courseId_teacherId_classId: {
          courseId,
          teacherId,
          classId: classId || null
        }
      }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'This course assignment already exists' 
      }, { status: 400 })
    }

    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId,
        teacherId,
        classId: classId || null,
        weeklyHours: parseInt(weeklyHours) || 4,
        preferences: preferences || null,
        isScheduled: false
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

    return NextResponse.json({ success: true, assignment })

  } catch (error: any) {
    console.error('Create course assignment error:', error)
    return NextResponse.json({ 
      error: 'Failed to create course assignment' 
    }, { status: 500 })
  }
}
