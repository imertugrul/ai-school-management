import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user || user.role !== 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const messages = await prisma.parentChatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return NextResponse.json(messages)
  } catch (err) {
    console.error('GET /api/parent/chat/history error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
