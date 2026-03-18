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

    // Get course assignment to find class
    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        courseId: params.courseId,
        teacherId: user.id
      }
    })

    if (!assignment || !assignment.classId) {
      return NextResponse.json({ success: true, students: [] })
    }

    // Get students in that class
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        classId: assignment.classId
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ success: true, students })

  } catch (error: any) {
    console.error('Get students error:', error)
    return NextResponse.json({ 
      error: 'Failed to get students' 
    }, { status: 500 })
  }
}
