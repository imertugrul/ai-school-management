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

    const parent = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!parent || parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    const links = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          include: {
            class: { select: { id: true, name: true } },
            attendanceRecords: {
              select: { status: true }
            },
            studentEnrollments: {
              where: { status: 'ACTIVE' },
              include: {
                course: {
                  include: {
                    gradeComponents: {
                      include: {
                        grades: {
                          where: { studentId: { not: '' } },
                          select: { score: true, studentId: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const children = links.map(link => {
      const student = link.student
      const totalRecords = student.attendanceRecords.length
      const presentRecords = student.attendanceRecords.filter(
        (r: { status: string }) => r.status === 'PRESENT' || r.status === 'LATE'
      ).length
      const attendanceRate = totalRecords > 0
        ? Math.round((presentRecords / totalRecords) * 100)
        : 0

      // Calculate GPA from grade components
      let totalWeighted = 0
      let totalWeight = 0
      for (const enrollment of student.studentEnrollments) {
        for (const component of enrollment.course.gradeComponents) {
          const studentGrade = component.grades.find((g: { studentId: string; score: number }) => g.studentId === student.id)
          if (studentGrade && component.maxScore > 0) {
            const pct = (studentGrade.score / component.maxScore) * 100
            totalWeighted += pct * component.weight
            totalWeight += component.weight
          }
        }
      }
      const gpa = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 10) / 10 : 0

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        class: student.class,
        gpa,
        attendanceRate,
        relationship: link.relationship
      }
    })

    return NextResponse.json({ success: true, children })
  } catch (error) {
    console.error('Parent children GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
  }
}
