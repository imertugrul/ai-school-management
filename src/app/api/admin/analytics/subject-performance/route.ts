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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const grades = await prisma.grade.findMany({
      where: {
        student: {
          schoolId: user.schoolId
        }
      },
      include: {
        component: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Group by course
    const courseMap = new Map<
      string,
      { courseCode: string; courseName: string; totalPercentage: number; count: number }
    >()

    for (const grade of grades) {
      const course = grade.component.course
      const percentage = (grade.score / grade.component.maxScore) * 100

      if (courseMap.has(course.id)) {
        const existing = courseMap.get(course.id)!
        existing.totalPercentage += percentage
        existing.count++
      } else {
        courseMap.set(course.id, {
          courseCode: course.code,
          courseName: course.name,
          totalPercentage: percentage,
          count: 1
        })
      }
    }

    const result = Array.from(courseMap.values())
      .filter((c) => c.count >= 1)
      .map((c) => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        averageScore: Math.round((c.totalPercentage / c.count) * 10) / 10,
        gradeCount: c.count
      }))
      .sort((a, b) => b.averageScore - a.averageScore)

    return NextResponse.json({ success: true, subjectPerformance: result })
  } catch (error: unknown) {
    console.error('Subject performance error:', error)
    return NextResponse.json({ error: 'Failed to get subject performance' }, { status: 500 })
  }
}
