import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function verifyParentAccess(parentUserId: string, studentId: string) {
  const guardian = await prisma.guardian.findFirst({ where: { studentId, userId: parentUserId } })
  if (guardian) return true
  const link = await prisma.parentStudent.findFirst({ where: { parentId: parentUserId, studentId } })
  return !!link
}

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user || !['PARENT', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role !== 'ADMIN') {
      const ok = await verifyParentAccess(user.id, params.studentId)
      if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bulletins = await prisma.performanceBulletin.findMany({
      where: { studentId: params.studentId, status: 'SENT' },
      include: { teacher: { select: { name: true } } },
      orderBy: { month: 'desc' },
    })

    return NextResponse.json({ bulletins })
  } catch (error) {
    console.error('parent bulletins error:', error)
    return NextResponse.json({ error: 'Failed to fetch bulletins' }, { status: 500 })
  }
}
