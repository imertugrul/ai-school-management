/**
 * GET /api/staff/attendance-report?from=2026-02-01&to=2026-03-23&classId=xxx
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const STAFF_ROLES = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY', 'ADMIN']

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true, schoolId: true } })
    if (!user || !STAFF_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const from  = new Date(searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
    const to    = new Date(searchParams.get('to')   ?? new Date().toISOString().split('T')[0])
    const classNameFilter = searchParams.get('classId') // we pass class name from UI
    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)

    // Find all students
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', schoolId: user.schoolId ?? undefined },
      select: {
        id: true, name: true,
        class: { select: { id: true, name: true } },
      },
    })

    // Filter by class name if provided
    const filtered = classNameFilter
      ? students.filter(s => s.class?.name === classNameFilter)
      : students

    // Fetch all records in date range
    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: { gte: from, lte: to },
        studentId: { in: filtered.map(s => s.id) },
      },
      select: { studentId: true, status: true, date: true, classId: true },
    })

    // Build per-student stats
    const statsMap: Record<string, { absent: number; late: number; excused: number; total: number }> = {}
    for (const s of filtered) {
      statsMap[s.id] = { absent: 0, late: 0, excused: 0, total: 0 }
    }
    records.forEach(r => {
      if (!statsMap[r.studentId]) return
      statsMap[r.studentId].total++
      if (r.status === 'ABSENT')  statsMap[r.studentId].absent++
      if (r.status === 'LATE')    statsMap[r.studentId].late++
      if (r.status === 'EXCUSED') statsMap[r.studentId].excused++
    })

    // Calculate attendance percentage (present days / total school days in range)
    const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000)
    const studentStats = filtered.map(s => {
      const st = statsMap[s.id]
      const presentDays = Math.max(0, totalDays - st.absent - st.excused)
      const pct = totalDays > 0 ? (presentDays / totalDays) * 100 : 100
      return {
        id:        s.id,
        name:      s.name,
        className: s.class?.name ?? 'Sınıfsız',
        absent:    st.absent,
        late:      st.late,
        excused:   st.excused,
        total:     st.total,
        pct:       Math.min(100, Math.max(0, pct)),
      }
    })

    // Class with most absences
    const classCounts: Record<string, number> = {}
    studentStats.forEach(s => {
      classCounts[s.className] = (classCounts[s.className] ?? 0) + s.absent
    })
    const topClass = Object.entries(classCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''

    // Top 5 students by absences
    const topStudents = [...studentStats].sort((a, b) => b.absent - a.absent).slice(0, 5)

    // Daily trend
    const dailyMap: Record<string, { absent: number; late: number }> = {}
    records.forEach(r => {
      const d = r.date.toISOString().split('T')[0]
      if (!dailyMap[d]) dailyMap[d] = { absent: 0, late: 0 }
      if (r.status === 'ABSENT') dailyMap[d].absent++
      if (r.status === 'LATE')   dailyMap[d].late++
    })
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }))

    return NextResponse.json({
      totalAbsent: studentStats.reduce((acc, s) => acc + s.absent, 0),
      totalLate:   studentStats.reduce((acc, s) => acc + s.late,   0),
      topClass,
      topStudents,
      studentStats,
      dailyTrend,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
