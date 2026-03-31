import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const filter = request.nextUrl.searchParams.get('status')

    const where = filter && filter !== 'ALL'
      ? { status: filter as any }
      : {}

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, status: true, createdAt: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    const counts = {
      pending:   users.filter(u => u.status === 'PENDING').length,
      active:    users.filter(u => u.status === 'ACTIVE').length,
      suspended: users.filter(u => u.status === 'SUSPENDED').length,
    }

    return NextResponse.json({ success: true, users, counts })
  } catch (error) {
    console.error('Pending users error:', error)
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}
