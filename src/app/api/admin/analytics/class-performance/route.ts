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
          select: {
            maxScore: true
          }
        },
        student: {
          select: {
            classId: true,
            class: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Group by class
    const classMap = new Map<
      string,
      { className: string; totalPercentage: number; gradeCount: number; studentIds: Set<string> }
    >()

    for (const grade of grades) {
      const cls = grade.student.class
      if (!cls) continue

      const percentage = (grade.score / grade.component.maxScore) * 100

      if (classMap.has(cls.id)) {
        const existing = classMap.get(cls.id)!
        existing.totalPercentage += percentage
        existing.gradeCount++
        existing.studentIds.add(grade.studentId)
      } else {
        classMap.set(cls.id, {
          className: cls.name,
          totalPercentage: percentage,
          gradeCount: 1,
          studentIds: new Set([grade.studentId])
        })
      }
    }

    const result = Array.from(classMap.values())
      .map((c) => ({
        className: c.className,
        averageScore: Math.round((c.totalPercentage / c.gradeCount) * 10) / 10,
        studentCount: c.studentIds.size
      }))
      .sort((a, b) => b.averageScore - a.averageScore)

    return NextResponse.json({ success: true, classPerformance: result })
  } catch (error: unknown) {
    console.error('Class performance error:', error)
    return NextResponse.json({ error: 'Failed to get class performance' }, { status: 500 })
  }
}
