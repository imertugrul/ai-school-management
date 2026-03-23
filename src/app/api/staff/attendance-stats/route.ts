/**
 * GET /api/staff/attendance-stats?since=2026-03-16
 * Quick weekly stats for dashboard
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
    const since = searchParams.get('since')
    const from  = since ? new Date(since) : new Date(Date.now() - 7 * 86400000)
    from.setHours(0, 0, 0, 0)

    const [absent, late] = await Promise.all([
      prisma.attendanceRecord.count({ where: { status: 'ABSENT', date: { gte: from } } }),
      prisma.attendanceRecord.count({ where: { status: 'LATE',   date: { gte: from } } }),
    ])

    return NextResponse.json({ absent, late })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
