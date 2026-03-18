import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
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

    // Get course with assignment info
    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        courseId: params.courseId,
        teacherId: user.id
      },
      include: {
        course: true,
        class: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const course = {
      id: assignment.course.id,
      code: assignment.course.code,
      name: assignment.course.name,
      class: assignment.class ? {
        id: assignment.class.id,
        name: assignment.class.name
      } : null
    }

    return NextResponse.json({ success: true, course })

  } catch (error: any) {
    console.error('Get course error:', error)
    return NextResponse.json({ 
      error: 'Failed to get course' 
    }, { status: 500 })
  }
}
