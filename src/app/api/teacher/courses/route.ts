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

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    // Get teacher's course assignments
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        teacherId: user.id
      },
      include: {
        course: {
          include: {
            gradeComponents: true
          }
        },
        class: true
      },
      orderBy: {
        course: {
          code: 'asc'
        }
      }
    })

    // Format courses with class info
    const courses = assignments.map(assignment => ({
      id: assignment.course.id,
      code: assignment.course.code,
      name: assignment.course.name,
      weeklyHours: assignment.weeklyHours,
      gradeComponentsCount: assignment.course.gradeComponents.length,
      class: assignment.class ? {
        id: assignment.class.id,
        name: assignment.class.name
      } : null
    }))

    return NextResponse.json({ success: true, courses })

  } catch (error: any) {
    console.error('Get teacher courses error:', error)
    return NextResponse.json({ 
      error: 'Failed to get courses' 
    }, { status: 500 })
  }
}
