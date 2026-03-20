import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId') || undefined
    const courseId  = searchParams.get('courseId')  || undefined
    const month     = searchParams.get('month')      // format: YYYY-MM

    const where: any = { teacher: { schoolId: user.schoolId ?? undefined } }
    if (teacherId) where.teacherId = teacherId
    if (courseId)  where.courseId  = courseId
    if (month) {
      const [y, m] = month.split('-').map(Number)
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt:  new Date(y, m, 1),
      }
    }

    const lessonPlans = await prisma.lessonPlan.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        course:  { select: { id: true, code: true, name: true } },
        class:   { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Fetch teachers for filter dropdown
    const teachers = await prisma.user.findMany({
      where: { schoolId: user.schoolId ?? undefined, role: 'TEACHER' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    // Fetch courses for filter dropdown
    const courses = await prisma.course.findMany({
      where: { schoolId: user.schoolId ?? undefined },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ success: true, lessonPlans, teachers, courses })
  } catch (error: any) {
    console.error('Admin lesson plans error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
