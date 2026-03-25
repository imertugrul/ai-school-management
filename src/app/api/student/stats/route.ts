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
      where: { email: session.user.email! },
      include: { class: { select: { grade: true } } }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    const isNinthGrade = user.class?.grade === '9'

    // Courses enrolled (via class assignments)
    const coursesEnrolled = user.classId
      ? await prisma.courseAssignment.count({ where: { classId: user.classId } })
      : 0

    // Average grade from GradeComponents
    const grades = await prisma.grade.findMany({
      where: { studentId: user.id },
      include: { component: { select: { maxScore: true, weight: true } } }
    })

    let averageGrade = 0
    if (grades.length > 0) {
      let totalWeighted = 0, totalWeight = 0
      for (const g of grades) {
        if (g.score != null && g.component.maxScore > 0) {
          const pct = (g.score / g.component.maxScore) * 100
          totalWeighted += pct * g.component.weight
          totalWeight += g.component.weight
        }
      }
      averageGrade = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 10) / 10 : 0
    }

    // Attendance rate
    const attendance = await prisma.attendanceRecord.findMany({
      where: { studentId: user.id },
      select: { status: true }
    })
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'EXCUSED').length
    const attendanceRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0

    // Pending tests (assigned but not submitted)
    const assignments = await prisma.testAssignment.count({
      where: { studentId: user.id }
    })
    const submitted = await prisma.submission.count({
      where: {
        studentId: user.id,
        status: { in: ['SUBMITTED', 'GRADED', 'RELEASED'] }
      }
    })

    // UniPath profile completion (only for grade 9)
    let unipathCompletion = 0
    if (isNinthGrade) {
      const uniProfile = await prisma.universityProfile.findUnique({ where: { studentId: user.id } })
      if (uniProfile) {
        const checks = [
          (uniProfile.targetRegion as string[])?.length > 0,
          !!uniProfile.educationLevel,
          !!uniProfile.startYear,
          !!uniProfile.fieldOfInterest,
          uniProfile.gpa != null,
          !!uniProfile.examScores,
          !!uniProfile.universityList,
          !!uniProfile.documentStatus,
        ]
        unipathCompletion = Math.round((checks.filter(Boolean).length / checks.length) * 100)
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        coursesEnrolled,
        averageGrade,
        attendanceRate,
        pendingTests: Math.max(0, assignments - submitted),
        isNinthGrade,
        unipathCompletion,
      }
    })

  } catch (error: any) {
    console.error('Student stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
