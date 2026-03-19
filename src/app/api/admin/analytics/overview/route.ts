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

    const schoolId = user.schoolId

    const [totalStudents, totalTeachers, totalClasses, totalCourses, totalTests, totalSubmissions] =
      await Promise.all([
        prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
        prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
        prisma.class.count({ where: { schoolId } }),
        prisma.course.count({ where: { schoolId } }),
        prisma.test.count({ where: { createdBy: { schoolId } } }),
        prisma.submission.count({ where: { student: { schoolId } } })
      ])

    return NextResponse.json({
      success: true,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalCourses,
      totalTests,
      totalSubmissions
    })
  } catch (error: unknown) {
    console.error('Analytics overview error:', error)
    return NextResponse.json({ error: 'Failed to get overview data' }, { status: 500 })
  }
}
