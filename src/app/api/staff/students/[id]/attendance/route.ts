/**
 * GET /api/staff/students/[id]/attendance
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

const STAFF_ROLES = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY', 'ADMIN']
type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } })
    if (!user || !STAFF_ROLES.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: params.id },
      include: { class: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json({ records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
