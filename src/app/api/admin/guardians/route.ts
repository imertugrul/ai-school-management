/**
 * GET /api/admin/guardians
 * Returns all students with their guardian summary (count, isPrimary status).
 * Used by the parent management split-panel page to populate the student list.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { role: true, schoolId: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const students = await prisma.user.findMany({
      where:   { role: 'STUDENT', ...(admin.schoolId ? { schoolId: admin.schoolId } : {}) },
      select: {
        id:    true,
        name:  true,
        email: true,
        class: { select: { id: true, name: true } },
        guardians: {
          select: { id: true, isPrimary: true },
        },
      },
      orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
    })

    return NextResponse.json({ students })
  } catch (error: any) {
    console.error('GET /api/admin/guardians error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
