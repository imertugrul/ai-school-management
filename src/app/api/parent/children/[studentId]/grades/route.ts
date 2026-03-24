import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function verifyParentAccess(parentUserId: string, studentId: string) {
  const guardian = await prisma.guardian.findFirst({ where: { studentId, userId: parentUserId } })
  if (guardian) return true
  const link = await prisma.parentStudent.findFirst({ where: { parentId: parentUserId, studentId } })
  return !!link
}

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user || !['PARENT', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role !== 'ADMIN') {
      const ok = await verifyParentAccess(user.id, params.studentId)
      if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all grade components for courses the student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: params.studentId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            gradeComponents: {
              include: {
                grades: {
                  where: { studentId: params.studentId },
                  select: { score: true, feedback: true, createdAt: true },
                },
              },
            },
          },
        },
      },
    })

    const courses = enrollments.map(enrollment => {
      const course = enrollment.course
      const components = course.gradeComponents.map(comp => {
        const grade = comp.grades[0] ?? null
        const score = grade ? grade.score : null
        const pct   = score !== null ? (score / comp.maxScore) * 100 : null
        return {
          id:         comp.id,
          name:       comp.name,
          type:       comp.type,
          weight:     comp.weight,
          maxScore:   comp.maxScore,
          date:       comp.date,
          score,
          percentage: pct !== null ? Math.round(pct * 10) / 10 : null,
          feedback:   grade?.feedback ?? null,
        }
      })

      // Weighted average for this course
      let wSum = 0, wTotal = 0
      for (const c of components) {
        if (c.score !== null) {
          wSum   += (c.score / c.maxScore) * 100 * c.weight
          wTotal += c.weight
        }
      }
      const average = wTotal > 0 ? Math.round((wSum / wTotal) * 10) / 10 : null

      return {
        id:         course.id,
        name:       course.name,
        subject:    course.grade ?? '',
        average,
        components,
      }
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('parent grades error:', error)
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}
