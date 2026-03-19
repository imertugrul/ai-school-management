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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') === 'bottom' ? 'bottom' : 'top'

    const grades = await prisma.grade.findMany({
      where: {
        student: {
          schoolId: user.schoolId,
          role: 'STUDENT'
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
            id: true,
            name: true,
            class: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Group by student
    const studentMap = new Map<
      string,
      { id: string; name: string; className: string; totalPercentage: number; count: number }
    >()

    for (const grade of grades) {
      const student = grade.student
      const percentage = (grade.score / grade.component.maxScore) * 100

      if (studentMap.has(student.id)) {
        const existing = studentMap.get(student.id)!
        existing.totalPercentage += percentage
        existing.count++
      } else {
        studentMap.set(student.id, {
          id: student.id,
          name: student.name,
          className: student.class?.name || 'N/A',
          totalPercentage: percentage,
          count: 1
        })
      }
    }

    // Only include students with at least 3 grades
    const students = Array.from(studentMap.values())
      .filter((s) => s.count >= 3)
      .map((s) => ({
        id: s.id,
        name: s.name,
        className: s.className,
        averageScore: Math.round((s.totalPercentage / s.count) * 10) / 10
      }))

    // Sort and take top/bottom 10
    const sorted = students.sort((a, b) =>
      type === 'top' ? b.averageScore - a.averageScore : a.averageScore - b.averageScore
    )

    const result = sorted.slice(0, 10)

    return NextResponse.json({ success: true, students: result })
  } catch (error: unknown) {
    console.error('Top students error:', error)
    return NextResponse.json({ error: 'Failed to get student rankings' }, { status: 500 })
  }
}
