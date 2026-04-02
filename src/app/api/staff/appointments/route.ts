import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } })
    if (!user || !['ADMIN', 'VICE_PRINCIPAL', 'COUNSELOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const appointments = await prisma.appointmentRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { name: true, email: true } },
        assignee: { select: { name: true } },
      },
    })
    return NextResponse.json(appointments)
  } catch (err) {
    console.error('GET /api/staff/appointments error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
