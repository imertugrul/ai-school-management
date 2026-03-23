/**
 * GET  /api/admin/staff — list all staff (VICE_PRINCIPAL, COUNSELOR, SECRETARY)
 * POST /api/admin/staff — create a new staff member
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireAdmin(email: string) {
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, schoolId: true } })
  return u?.role === 'ADMIN' ? u : null
}

const STAFF_ROLES = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await requireAdmin(session.user.email)
    if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const staff = await prisma.user.findMany({
      where: { role: { in: STAFF_ROLES as any }, schoolId: admin.schoolId ?? undefined },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ staff })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = await requireAdmin(session.user.email)
    if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    if (!admin.schoolId) return NextResponse.json({ error: 'School not configured' }, { status: 400 })

    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'name, email, password, role required' }, { status: 400 })
    }
    if (!STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of: ${STAFF_ROLES.join(', ')}` }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Bu email adresi zaten kayıtlı' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role as any, schoolId: admin.schoolId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
