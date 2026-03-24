/**
 * GET /api/analytics/teacher
 * Query: ?courseId=&classId=
 * Returns teacher-specific analytics
 * Auth: TEACHER only
 */
export const revalidate = 300

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!teacher || !['TEACHER', 'ADMIN'].includes(teacher.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId') || null
    const classId  = searchParams.get('classId')  || null

    // Get teacher's course assignments
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        teacherId: teacher.id,
        ...(courseId ? { courseId } : {}),
        ...(classId  ? { classId }  : {}),
      },
      include: { course: { select: { id: true, name: true } }, class: { select: { id: true, name: true } } },
    })
    const courseIds = [...new Set(assignments.map(a => a.courseId))]
    const classIds  = [...new Set(assignments.map(a => a.classId).filter(Boolean))] as string[]

    if (courseIds.length === 0) {
      return NextResponse.json({ classStats: null, componentAverages: [], studentPerformance: [], trend: [], atRisk: [], courses: [], classes: [] })
    }

    // ── Component averages ──────────────────────────────────────────────────
    const components = await prisma.gradeComponent.findMany({
      where: { courseId: { in: courseIds } },
      include: { grades: { select: { score: true, studentId: true } } },
    })
    const componentAverages = components.map(comp => {
      const scores = comp.grades.map(g => (g.score / comp.maxScore) * 100)
      const avg    = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null
      return { id: comp.id, name: comp.name, type: comp.type, avg, count: scores.length }
    })

    // ── Students ─────────────────────────────────────────────────────────────
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(classIds.length > 0 ? { classId: { in: classIds } } : { schoolId: teacher.schoolId ?? undefined }),
      },
      select: { id: true, name: true, classId: true, class: { select: { name: true } } },
    })

    const studentPerf = await Promise.all(students.map(async s => {
      const grades = await prisma.grade.findMany({
        where: { studentId: s.id, component: { courseId: { in: courseIds } } },
        include: { component: { select: { weight: true, maxScore: true } } },
      })
      if (grades.length === 0) return null
      let ws = 0, wt = 0
      for (const g of grades) { ws += (g.score / g.component.maxScore) * 100 * g.component.weight; wt += g.component.weight }
      const avg = wt > 0 ? Math.round(ws / wt * 10) / 10 : null

      const attRecords = await prisma.attendanceRecord.findMany({
        where: { studentId: s.id, ...(classIds.length > 0 ? { classId: { in: classIds } } : {}) },
        select: { status: true },
      })
      const total   = attRecords.length
      const present = attRecords.filter(r => r.status === 'PRESENT').length
      const attRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 100

      return { id: s.id, name: s.name, class: s.class?.name ?? '', avg, attendanceRate: attRate }
    }))
    const filteredStudents = studentPerf.filter(Boolean) as { id: string; name: string; class: string; avg: number | null; attendanceRate: number }[]

    // Class stats
    const avgs        = filteredStudents.map(s => s.avg).filter(v => v !== null) as number[]
    const classAvg    = avgs.length > 0 ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length * 10) / 10 : null
    const attRates    = filteredStudents.map(s => s.attendanceRate)
    const classAttRate = attRates.length > 0 ? Math.round(attRates.reduce((a, b) => a + b, 0) / attRates.length * 10) / 10 : null
    const maxGrade    = avgs.length > 0 ? Math.max(...avgs) : null
    const minGrade    = avgs.length > 0 ? Math.min(...avgs) : null

    // At-risk
    const atRisk = filteredStudents.filter(s => (s.avg !== null && s.avg < 60) || s.attendanceRate < 80)
      .map(s => ({ ...s, riskFactors: [...(s.avg !== null && s.avg < 60 ? ['LOW_GRADE'] : []), ...(s.attendanceRate < 80 ? ['HIGH_ABSENCE'] : [])] }))

    // Trend: component dates as proxy for assessment timeline
    const sortedComponents = [...components].sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
    const trend = sortedComponents.map(comp => {
      const scores = comp.grades.map(g => (g.score / comp.maxScore) * 100)
      const avg    = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null
      return { name: comp.name, avg }
    }).filter(t => t.avg !== null)

    // Available courses + classes for filter dropdowns
    const courseList  = assignments.map(a => ({ id: a.courseId, name: a.course.name })).filter((v, i, s) => s.findIndex(x => x.id === v.id) === i)
    const classList   = assignments.map(a => a.class ? { id: a.classId!, name: a.class.name } : null).filter(Boolean) as { id: string; name: string }[]

    return NextResponse.json({
      classStats: { avg: classAvg, attendanceRate: classAttRate, maxGrade, minGrade, studentCount: filteredStudents.length },
      componentAverages,
      studentPerformance: filteredStudents.sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)),
      trend,
      atRisk,
      courses: courseList,
      classes: classList.filter((v, i, s) => s.findIndex(x => x.id === v.id) === i),
    })
  } catch (error) {
    console.error('analytics/teacher error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
