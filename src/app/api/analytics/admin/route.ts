/**
 * GET /api/analytics/admin
 * Query: ?classId=&month=2026-03
 * Returns comprehensive admin analytics
 * Auth: ADMIN only
 */
export const revalidate = 300 // 5 min cache

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, schoolId: true },
    })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    if (!admin.schoolId) return NextResponse.json({ error: 'No school' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const classId   = searchParams.get('classId') || null
    const monthParam = searchParams.get('month') || null // "2026-03"

    // --- Date range ---
    let dateStart: Date | undefined
    let dateEnd: Date | undefined
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number)
      dateStart = new Date(y, m - 1, 1)
      dateEnd   = new Date(y, m, 0, 23, 59, 59)
    }

    const attendanceWhere: Record<string, unknown> = {
      class: { schoolId: admin.schoolId },
    }
    if (classId) attendanceWhere.classId = classId
    if (dateStart) attendanceWhere.date = { gte: dateStart, lte: dateEnd }

    // ── KPIs ────────────────────────────────────────────────────────────────
    const [studentCount, teacherCount, classCount] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', schoolId: admin.schoolId } }),
      prisma.user.count({ where: { role: 'TEACHER', schoolId: admin.schoolId } }),
      prisma.class.count({ where: { schoolId: admin.schoolId } }),
    ])

    // Grade average across school
    const allGrades = await prisma.grade.findMany({
      where: { student: { schoolId: admin.schoolId, ...(classId ? { classId } : {}) } },
      include: { component: { select: { weight: true, maxScore: true } } },
    })
    let wSum = 0, wTotal = 0
    for (const g of allGrades) {
      const pct = (g.score / g.component.maxScore) * 100
      wSum += pct * g.component.weight
      wTotal += g.component.weight
    }
    const avgGrade = wTotal > 0 ? Math.round((wSum / wTotal) * 10) / 10 : null

    // Attendance rate
    const attendanceCounts = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: attendanceWhere as any,
      _count: { status: true },
    })
    const attMap: Record<string, number> = {}
    for (const row of attendanceCounts) attMap[row.status] = row._count.status
    const totalAtt   = Object.values(attMap).reduce((s, v) => s + v, 0)
    const presentAtt = attMap['PRESENT'] ?? 0
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : null

    // Completed tests (submissions with score)
    const completedTests = await prisma.submission.count({
      where: { totalScore: { not: null }, test: { createdBy: { schoolId: admin.schoolId } } },
    })

    // ── Grade distribution ──────────────────────────────────────────────────
    const gradeDist = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    for (const g of allGrades) {
      const pct = (g.score / g.component.maxScore) * 100
      if (pct >= 90) gradeDist.A++
      else if (pct >= 80) gradeDist.B++
      else if (pct >= 70) gradeDist.C++
      else if (pct >= 60) gradeDist.D++
      else gradeDist.F++
    }

    // By-class averages
    const classes = await prisma.class.findMany({
      where: { schoolId: admin.schoolId },
      select: { id: true, name: true },
    })
    const byClass = await Promise.all(classes.map(async cls => {
      const grades = await prisma.grade.findMany({
        where: { student: { classId: cls.id } },
        include: { component: { select: { weight: true, maxScore: true } } },
      })
      if (grades.length === 0) return { class: cls.name, avg: null }
      let ws = 0, wt = 0
      for (const g of grades) { ws += (g.score / g.component.maxScore) * 100 * g.component.weight; wt += g.component.weight }
      return { class: cls.name, avg: wt > 0 ? Math.round(ws / wt * 10) / 10 : null }
    }))

    // ── Attendance trend (last 6 months) ────────────────────────────────────
    const now = new Date()
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const rows = await prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { class: { schoolId: admin.schoolId }, ...(classId ? { classId } : {}), date: { gte: mStart, lte: mEnd } },
        _count: { status: true },
      })
      const m: Record<string, number> = {}
      for (const r of rows) m[r.status] = r._count.status
      trend.push({
        month: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
        absent:  m['ABSENT']  ?? 0,
        late:    m['LATE']    ?? 0,
        excused: m['EXCUSED'] ?? 0,
        present: m['PRESENT'] ?? 0,
      })
    }

    // ── Teacher performance ─────────────────────────────────────────────────
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', schoolId: admin.schoolId },
      select: { id: true, name: true },
    })
    const teacherPerf = await Promise.all(teachers.map(async t => {
      const assignments = await prisma.courseAssignment.findMany({
        where: { teacherId: t.id },
        select: { courseId: true, classId: true, course: { select: { name: true } } },
      })
      const courseIds = assignments.map(a => a.courseId)
      const grades = await prisma.grade.findMany({
        where: { component: { courseId: { in: courseIds } } },
        include: { component: { select: { weight: true, maxScore: true } } },
      })
      if (grades.length === 0) return null
      let ws = 0, wt = 0
      for (const g of grades) { ws += (g.score / g.component.maxScore) * 100 * g.component.weight; wt += g.component.weight }
      const testCount = await prisma.test.count({ where: { createdById: t.id } })
      return {
        teacher: t.name,
        courses: assignments.map(a => a.course.name).filter((v, i, s) => s.indexOf(v) === i).slice(0, 3).join(', '),
        avgGrade: wt > 0 ? Math.round(ws / wt * 10) / 10 : null,
        testCount,
      }
    }))

    // ── At-risk students ────────────────────────────────────────────────────
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', schoolId: admin.schoolId, ...(classId ? { classId } : {}) },
      select: { id: true, name: true, class: { select: { name: true } } },
    })
    const atRisk = (await Promise.all(students.map(async s => {
      const grades = await prisma.grade.findMany({
        where: { studentId: s.id },
        include: { component: { select: { weight: true, maxScore: true } } },
      })
      if (grades.length === 0) return null
      let ws = 0, wt = 0
      for (const g of grades) { ws += (g.score / g.component.maxScore) * 100 * g.component.weight; wt += g.component.weight }
      const avg = wt > 0 ? Math.round(ws / wt * 10) / 10 : null

      const attRecords = await prisma.attendanceRecord.findMany({
        where: { studentId: s.id, class: { schoolId: admin.schoolId ?? undefined } },
        select: { status: true },
      })
      const total   = attRecords.length
      const present = attRecords.filter(r => r.status === 'PRESENT').length
      const attRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 100

      const factors: string[] = []
      if (avg !== null && avg < 60) factors.push('LOW_GRADE')
      if (attRate < 80) factors.push('HIGH_ABSENCE')
      if (factors.length === 0) return null

      return { student: s.name, class: s.class?.name ?? '', avg, attendanceRate: attRate, riskFactors: factors }
    }))).filter(Boolean) as { student: string; class: string; avg: number | null; attendanceRate: number; riskFactors: string[] }[]

    // ── AI usage ────────────────────────────────────────────────────────────
    const [lessonPlanCount, bulletinCount] = await Promise.all([
      prisma.lessonPlan.count({ where: { teacher: { schoolId: admin.schoolId } } }),
      prisma.performanceBulletin.count({ where: { teacher: { schoolId: admin.schoolId }, status: 'SENT' } }),
    ])

    return NextResponse.json({
      kpis: { students: studentCount, teachers: teacherCount, classes: classCount, avgGrade, attendanceRate, completedTests },
      gradeDistribution: { ...gradeDist, byClass: byClass.filter(c => c.avg !== null) },
      attendanceTrend: trend,
      teacherPerformance: teacherPerf.filter(Boolean),
      atRiskStudents: atRisk.slice(0, 20),
      aiUsage: { lessonPlans: lessonPlanCount, gradedTests: bulletinCount },
    })
  } catch (error) {
    console.error('analytics/admin error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
