/**
 * GET /api/staff/students
 * Returns all students with class + guardian info (read-only, no grades)
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'

const STAFF_ROLES = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY', 'ADMIN']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, schoolId: true },
    })
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!hasPermission(user.role, 'students.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', schoolId: user.schoolId ?? undefined },
      select: {
        id: true, name: true, email: true,
        class: { select: { id: true, name: true } },
        guardians: { select: { id: true, name: true, relationship: true, email: true, phone: true, isPrimary: true } },
        _count: { select: { attendanceRecords: { where: { status: { in: ['ABSENT', 'LATE'] } } } } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      students: students.map(s => ({
        id:           s.id,
        name:         s.name,
        email:        s.email,
        classId:      s.class?.id ?? null,
        className:    s.class?.name ?? null,
        guardians:    s.guardians,
        absenceCount: s._count.attendanceRecords,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
