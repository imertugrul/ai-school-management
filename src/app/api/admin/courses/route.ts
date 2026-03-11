import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - List all courses
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

    const courses = await prisma.course.findMany({
      include: {
        school: true,
        schedules: {
          include: {
            teacher: {
              select: { name: true, email: true }
            },
            class: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            schedules: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, courses })

  } catch (error: any) {
    console.error('Get courses error:', error)
    return NextResponse.json({ 
      error: 'Failed to get courses' 
    }, { status: 500 })
  }
}

// POST - Create new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { school: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const { code, name, description, credits, grade } = await request.json()

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    })

    if (existingCourse) {
      return NextResponse.json({ 
        error: 'Course code already exists' 
      }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        credits: parseInt(credits) || 3,
        grade,
        schoolId: user.schoolId
      }
    })

    return NextResponse.json({ success: true, course })

  } catch (error: any) {
    console.error('Create course error:', error)
    return NextResponse.json({ 
      error: 'Failed to create course' 
    }, { status: 500 })
  }
}
