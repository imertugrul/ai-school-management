/**
 * GET /api/staff/schedule — full weekly schedule (read-only)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const STAFF_ROLES = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY', 'ADMIN']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true, schoolId: true } })
    if (!user || !STAFF_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const entries = await prisma.schedule.findMany({
      include: {
        teacher: { select: { id: true, name: true } },
        class:   { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    // Unique classes and teachers for filter dropdowns
    const classMap: Record<string, { id: string; name: string }> = {}
    const teacherMap: Record<string, { id: string; name: string }> = {}
    entries.forEach(e => {
      if (e.class) classMap[e.class.id] = e.class
      teacherMap[e.teacher.id] = e.teacher
    })

    return NextResponse.json({
      entries,
      classes:  Object.values(classMap),
      teachers: Object.values(teacherMap),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
