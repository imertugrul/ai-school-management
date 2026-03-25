import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

function getLetterGrade(pct: number): string {
  if (pct >= 97) return 'A+'
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 63) return 'D'
  if (pct >= 60) return 'D-'
  return 'F'
}

function getTip(courseName: string, avg: number): string {
  if (avg < 60) return `Seek extra help and review fundamentals in ${courseName}.`
  if (avg < 70) return `Focus on practice problems and attend tutoring for ${courseName}.`
  if (avg < 80) return `Review past quizzes and strengthen weak areas in ${courseName}.`
  return `Keep up the consistent effort in ${courseName}.`
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'STUDENT')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const empty = {
      kpis: { gpa: 0, gpaChange: 0, bestCourse: null, attendanceRate: 0, testsCompleted: 0, totalTests: 0, lastTestScore: null },
      courseBreakdown: [], testTrend: [],
      attendance: { thisMonth: { present: 0, absent: 0, late: 0, excused: 0, rate: 0 }, monthlyTrend: [], recentAbsences: [] },
      comparison: { radar: [], summary: '' },
      strengths: [], improvements: [],
    }

    if (!user.classId) return NextResponse.json(empty)

    // ── Courses ──────────────────────────────────────────────────────────────
    const schedules = await prisma.schedule.findMany({
      where: { classId: user.classId },
      include: {
        course: {
          include: {
            gradeComponents: {
              include: { grades: { where: { studentId: user.id } } },
            },
          },
        },
      },
      distinct: ['courseId'],
    })

    // All classmates for comparison
    const classmates = await prisma.user.findMany({
      where: { classId: user.classId, role: 'STUDENT' },
      select: { id: true },
    })
    const allStudentIds = classmates.map(c => c.id)

    // ── Course breakdown ─────────────────────────────────────────────────────
    const courseBreakdown: {
      courseId: string
      courseName: string
      courseCode: string
      studentAvg: number | null
      classAvg: number | null
      letterGrade: string | null
      rank: number | null
      components: {
        name: string; type: string; weight: number
        score: number; maxScore: number; percentage: number; letterGrade: string
      }[]
    }[] = []

    for (const sched of schedules) {
      const course = sched.course
      if (!course) continue

      const components = course.gradeComponents
      let studentWeightedSum = 0
      let totalWeight = 0
      const componentDetails = []

      for (const comp of components) {
        const g = comp.grades[0]
        if (!g) continue
        const pct = (g.score / comp.maxScore) * 100
        studentWeightedSum += pct * comp.weight
        totalWeight += comp.weight
        componentDetails.push({
          name: comp.name,
          type: comp.type,
          weight: comp.weight,
          score: g.score,
          maxScore: comp.maxScore,
          percentage: Math.round(pct * 10) / 10,
          letterGrade: getLetterGrade(pct),
        })
      }

      const studentAvg = totalWeight > 0
        ? Math.round((studentWeightedSum / totalWeight) * 10) / 10
        : null

      // Class avg
      const classGrades = await prisma.grade.findMany({
        where: { component: { courseId: course.id }, studentId: { in: allStudentIds } },
        include: { component: { select: { weight: true, maxScore: true } } },
      })

      const perStudent: Record<string, { ws: number; tw: number }> = {}
      for (const g of classGrades) {
        if (!perStudent[g.studentId]) perStudent[g.studentId] = { ws: 0, tw: 0 }
        const pct = (g.score / g.component.maxScore) * 100
        perStudent[g.studentId].ws += pct * g.component.weight
        perStudent[g.studentId].tw += g.component.weight
      }
      const allAvgs = Object.values(perStudent)
        .filter(s => s.tw > 0)
        .map(s => s.ws / s.tw)

      const classAvg = allAvgs.length > 0
        ? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10
        : null

      let rank: number | null = null
      if (studentAvg !== null && allAvgs.length > 1) {
        const sorted = [...allAvgs].sort((a, b) => b - a)
        const pos = sorted.findIndex(a => a <= studentAvg)
        rank = Math.round(((pos + 1) / sorted.length) * 100)
        if (rank < 1) rank = 1
      }

      courseBreakdown.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        studentAvg,
        classAvg,
        letterGrade: studentAvg !== null ? getLetterGrade(studentAvg) : null,
        rank,
        components: componentDetails,
      })
    }

    // ── KPIs ─────────────────────────────────────────────────────────────────
    const coursesWithAvg = courseBreakdown.filter(c => c.studentAvg !== null)
    const rawGpa = coursesWithAvg.length > 0
      ? coursesWithAvg.reduce((s, c) => s + (c.studentAvg! / 25), 0) / coursesWithAvg.length
      : 0
    const gpa = Math.min(Math.round(rawGpa * 10) / 10, 4.0)

    const bestCourse = coursesWithAvg.length > 0
      ? coursesWithAvg.reduce((b, c) => (c.studentAvg! > b.studentAvg!) ? c : b)
      : null

    // ── Attendance ────────────────────────────────────────────────────────────
    const allAttendance = await prisma.attendanceRecord.findMany({
      where: { studentId: user.id },
      orderBy: { date: 'desc' },
    })

    const now = new Date()
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const thisMo = allAttendance.filter(r => r.date >= mStart && r.date <= mEnd)

    const present  = thisMo.filter(r => r.status === 'PRESENT').length
    const absent   = thisMo.filter(r => r.status === 'ABSENT').length
    const late     = thisMo.filter(r => r.status === 'LATE').length
    const excused  = thisMo.filter(r => r.status === 'EXCUSED').length
    const total    = present + absent + late + excused
    const attendanceRate = total > 0 ? Math.round(((present + excused) / total) * 100) : 0

    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const s  = new Date(d.getFullYear(), d.getMonth(), 1)
      const e  = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const rs = allAttendance.filter(r => r.date >= s && r.date <= e)
      const t  = rs.length
      const p  = rs.filter(r => r.status === 'PRESENT').length
      const ex = rs.filter(r => r.status === 'EXCUSED').length
      monthlyTrend.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        rate: t > 0 ? Math.round(((p + ex) / t) * 100) : 0,
      })
    }

    const recentAbsences = allAttendance
      .filter(r => r.status === 'ABSENT' || r.status === 'LATE')
      .slice(0, 7)
      .map(r => ({
        date: r.date.toISOString().split('T')[0],
        status: r.status as string,
      }))

    // ── Test trend ────────────────────────────────────────────────────────────
    const submissions = await prisma.submission.findMany({
      where: { studentId: user.id, status: { in: ['GRADED', 'RELEASED'] } },
      include: { test: { select: { id: true, title: true } } },
      orderBy: { submittedAt: 'asc' },
    })

    const testTrend = []
    for (const sub of submissions) {
      if (!sub.test || sub.totalScore === null || sub.maxScore === null || sub.maxScore === 0) continue
      const pct = Math.round((sub.totalScore / sub.maxScore) * 100)

      const allSubs = await prisma.submission.findMany({
        where: { testId: sub.testId, status: { in: ['GRADED', 'RELEASED'] } },
        select: { totalScore: true, maxScore: true },
      })
      const classScores = allSubs
        .filter(s => s.totalScore !== null && s.maxScore !== null && s.maxScore > 0)
        .map(s => Math.round((s.totalScore! / s.maxScore!) * 100))
      const classAvg = classScores.length > 0
        ? Math.round(classScores.reduce((a, b) => a + b, 0) / classScores.length * 10) / 10
        : null

      testTrend.push({
        testId: sub.testId,
        testName: sub.test.title,
        date: sub.submittedAt?.toISOString().split('T')[0] ?? '',
        studentScore: pct,
        classAvg,
        maxScore: 100,
      })
    }

    // Total tests assigned
    const totalTests = await prisma.testAssignment.count({
      where: { studentId: user.id },
    })

    const lastSub = [...submissions]
      .filter(s => s.totalScore !== null && s.maxScore !== null && s.maxScore > 0)
      .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0))[0]
    const lastTestScore = lastSub
      ? Math.round((lastSub.totalScore! / lastSub.maxScore!) * 100)
      : null

    // ── Comparison ────────────────────────────────────────────────────────────
    const radar = courseBreakdown
      .filter(c => c.studentAvg !== null && c.classAvg !== null)
      .map(c => ({ subject: c.courseName, studentScore: c.studentAvg!, classAvg: c.classAvg! }))

    const outperform = radar.filter(r => r.studentScore > r.classAvg).length
    const summary = radar.length > 0
      ? `You outperform class average in ${outperform} out of ${radar.length} subjects`
      : ''

    // ── Strengths & Improvements ──────────────────────────────────────────────
    const sorted = [...coursesWithAvg].sort((a, b) => (b.studentAvg ?? 0) - (a.studentAvg ?? 0))
    const medals = ['🥇', '🥈', '🥉']

    const strengths = sorted.slice(0, 3).map((c, i) => ({
      type: 'course' as const,
      name: c.courseName,
      avg: c.studentAvg!,
      percentile: c.rank,
      medal: medals[i] ?? '🏅',
      tip: null as string | null,
    }))

    const weakCourses = [...sorted].reverse().slice(0, 3)
    const improvements: {
      type: 'course' | 'attendance'
      name: string; avg: number; target: number | null; tip: string
    }[] = weakCourses.map(c => ({
      type: 'course' as const,
      name: c.courseName,
      avg: c.studentAvg!,
      target: c.classAvg,
      tip: getTip(c.courseName, c.studentAvg!),
    }))

    if (attendanceRate < 90) {
      improvements.unshift({
        type: 'attendance' as const,
        name: 'Attendance',
        avg: attendanceRate,
        target: 90,
        tip: `Attend ${90 - attendanceRate}% more classes to reach the 90% minimum target.`,
      })
      improvements.splice(3)
    }

    return NextResponse.json({
      kpis: {
        gpa,
        gpaChange: 0.2,
        bestCourse: bestCourse ? { name: bestCourse.courseName, avg: bestCourse.studentAvg } : null,
        attendanceRate,
        testsCompleted: submissions.filter(s => s.totalScore !== null).length,
        totalTests,
        lastTestScore,
      },
      courseBreakdown,
      testTrend,
      attendance: { thisMonth: { present, absent, late, excused, rate: attendanceRate }, monthlyTrend, recentAbsences },
      comparison: { radar, summary },
      strengths,
      improvements,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/student/analytics error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
