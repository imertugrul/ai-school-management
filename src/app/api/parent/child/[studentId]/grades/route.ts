import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!parent || parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    // Verify parent-student link
    const link = await prisma.parentStudent.findFirst({
      where: { parentId: parent.id, studentId: params.studentId }
    })

    if (!link) {
      return NextResponse.json({ error: 'Not authorized to view this student' }, { status: 403 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: params.studentId,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            gradeComponents: {
              include: {
                grades: {
                  where: { studentId: params.studentId }
                }
              }
            }
          }
        }
      }
    })

    const courses = enrollments.map(enrollment => {
      const components = enrollment.course.gradeComponents.map(comp => {
        const grade = comp.grades[0]
        return {
          id: comp.id,
          name: comp.name,
          type: comp.type,
          weight: comp.weight,
          maxScore: comp.maxScore,
          score: grade?.score ?? null,
          feedback: grade?.feedback ?? null,
          percentage: grade ? Math.round((grade.score / comp.maxScore) * 100) : null
        }
      })

      let weightedAvg = 0
      let totalWeight = 0
      components.forEach(c => {
        if (c.score !== null && c.maxScore > 0) {
          const pct = (c.score / c.maxScore) * 100
          weightedAvg += pct * c.weight
          totalWeight += c.weight
        }
      })
      const average = totalWeight > 0 ? Math.round((weightedAvg / totalWeight) * 10) / 10 : null

      return {
        courseId: enrollment.course.id,
        courseName: enrollment.course.name,
        courseCode: enrollment.course.code,
        components,
        weightedAverage: average
      }
    })

    return NextResponse.json({ success: true, courses })
  } catch (error) {
    console.error('Parent child grades GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}
