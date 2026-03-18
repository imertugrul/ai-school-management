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

    // Get all grade components for this course
    const components = await prisma.gradeComponent.findMany({
      where: { courseId: params.courseId }
    })

    const componentIds = components.map(c => c.id)

    // Get all grades for these components
    const grades = await prisma.grade.findMany({
      where: {
        componentId: { in: componentIds }
      },
      select: {
        componentId: true,
        studentId: true,
        score: true
      }
    })

    return NextResponse.json({ success: true, grades })

  } catch (error: any) {
    console.error('Get grades error:', error)
    return NextResponse.json({ 
      error: 'Failed to get grades' 
    }, { status: 500 })
  }
}

export async function POST(
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

    const { grades } = await request.json()

    // Upsert grades (create or update)
    const operations = grades.map(async (grade: any) => {
      if (grade.score === null || grade.score === undefined) {
        // Delete if score is null
        return prisma.grade.deleteMany({
          where: {
            componentId: grade.componentId,
            studentId: grade.studentId
          }
        })
      } else {
        // Upsert (create or update)
        return prisma.grade.upsert({
          where: {
            componentId_studentId: {
              componentId: grade.componentId,
              studentId: grade.studentId
            }
          },
          update: {
            score: grade.score
          },
          create: {
            componentId: grade.componentId,
            studentId: grade.studentId,
            score: grade.score
          }
        })
      }
    })

    await Promise.all(operations)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Save grades error:', error)
    return NextResponse.json({ 
      error: 'Failed to save grades' 
    }, { status: 500 })
  }
}
