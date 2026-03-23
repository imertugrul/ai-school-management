/**
 * GET  /api/teacher/bulletins?month=2026-03&classId=xxx  — list bulletins
 * POST /api/teacher/bulletins  { month, classId }         — collect & create drafts
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function requireTeacher(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, name: true, schoolId: true },
  })
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const teacher = await requireTeacher(session.user.email)
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month   = searchParams.get('month')
    const classId = searchParams.get('classId')

    if (!month || !classId) {
      return NextResponse.json({ error: 'month and classId required' }, { status: 400 })
    }

    const bulletins = await prisma.performanceBulletin.findMany({
      where: { teacherId: teacher.id, month, classId },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { student: { name: 'asc' } },
    })

    return NextResponse.json({ bulletins })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const teacher = await requireTeacher(session.user.email)
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { month, classId } = await request.json()
    if (!month || !classId) {
      return NextResponse.json({ error: 'month and classId required' }, { status: 400 })
    }

    // Parse month boundaries
    const [year, mon] = month.split('-').map(Number)
    const startDate = new Date(year, mon - 1, 1)
    const endDate   = new Date(year, mon, 1)

    // Fetch students in class
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: { select: { id: true, name: true } },
      },
    })
    if (!classData) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    // For each student: collect attendance + grades, upsert bulletin
    const results = []
    for (const student of classData.students) {
      // Attendance
      const attendance = await prisma.attendanceRecord.findMany({
        where: {
          studentId: student.id,
          classId,
          date: { gte: startDate, lt: endDate },
        },
        select: { status: true },
      })
      const attendancePresent = attendance.filter(a => a.status === 'PRESENT').length
      const attendanceAbsent  = attendance.filter(a => a.status === 'ABSENT').length
      const attendanceLate    = attendance.filter(a => a.status === 'LATE' || a.status === 'EXCUSED').length

      // Grades — find courseAssignments for this teacher+class
      const assignments = await prisma.courseAssignment.findMany({
        where: { teacherId: teacher.id, classId },
        include: {
          course: { select: { id: true, name: true } },
        },
      })

      const gradeDetails: { courseName: string; average: number }[] = []
      let totalWeightedScore = 0
      let totalWeight = 0

      for (const assignment of assignments) {
        const components = await prisma.gradeComponent.findMany({
          where: {
            courseId: assignment.courseId,
            date: { gte: startDate, lt: endDate },
          },
          include: {
            grades: {
              where: { studentId: student.id },
              select: { score: true },
            },
          },
        })

        let courseScore = 0
        let courseWeight = 0
        for (const comp of components) {
          const grade = comp.grades[0]
          if (!grade || comp.maxScore === 0) continue
          const normalized = (grade.score / comp.maxScore) * 100
          courseScore  += normalized * comp.weight
          courseWeight += comp.weight
        }

        if (courseWeight > 0) {
          const avg = courseScore / courseWeight
          gradeDetails.push({ courseName: assignment.course.name, average: avg })
          totalWeightedScore += avg
          totalWeight++
        }
      }

      const gradeAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : null

      // Upsert bulletin (keep survey fields if already filled)
      const existing = await prisma.performanceBulletin.findFirst({
        where: { teacherId: teacher.id, studentId: student.id, month },
      })

      const bulletin = await prisma.performanceBulletin.upsert({
        where: {
          teacherId_studentId_month: {
            teacherId: teacher.id,
            studentId: student.id,
            month,
          },
        },
        create: {
          teacherId: teacher.id,
          studentId: student.id,
          classId,
          month,
          attendancePresent,
          attendanceAbsent,
          attendanceLate,
          gradeAverage,
          gradeDetails: gradeDetails.length > 0 ? gradeDetails : undefined,
          status: 'DRAFT',
        },
        update: {
          attendancePresent,
          attendanceAbsent,
          attendanceLate,
          gradeAverage,
          gradeDetails: gradeDetails.length > 0 ? gradeDetails : undefined,
          // Keep status/survey fields if already filled
          ...(existing?.status === 'DRAFT' ? {} : {}),
        },
        include: { student: { select: { id: true, name: true } } },
      })

      results.push(bulletin)
    }

    return NextResponse.json({ bulletins: results, count: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
