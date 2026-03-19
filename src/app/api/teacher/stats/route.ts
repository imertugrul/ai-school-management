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

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    // Tests created by this teacher
    const tests = await prisma.test.findMany({
      where: { createdById: teacher.id },
      include: {
        submissions: {
          where: { status: { in: ['SUBMITTED', 'GRADED', 'RELEASED'] } },
          select: { totalScore: true, maxScore: true }
        }
      }
    })

    const testsCreated = tests.length

    const allSubmissions = tests.flatMap(t => t.submissions)
    const studentsGraded = allSubmissions.length

    const scoredSubs = allSubmissions.filter(s => s.totalScore != null && s.maxScore && s.maxScore > 0)
    const averageScore = scoredSubs.length > 0
      ? scoredSubs.reduce((sum, s) => sum + ((s.totalScore! / s.maxScore!) * 100), 0) / scoredSubs.length
      : 0

    // Assigned classes count
    const assignedClasses = await prisma.courseAssignment.findMany({
      where: { teacherId: teacher.id },
      distinct: ['classId']
    })

    return NextResponse.json({
      success: true,
      stats: {
        testsCreated,
        studentsGraded,
        averageScore: Math.round(averageScore * 10) / 10,
        classesCount: assignedClasses.length
      }
    })

  } catch (error: any) {
    console.error('Teacher stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
