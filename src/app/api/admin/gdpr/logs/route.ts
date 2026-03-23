import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { role: true },
    })

    if (admin?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'gdpr'

    if (type === 'ai') {
      const logs = await prisma.aiLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      return NextResponse.json({ logs })
    }

    // default: gdpr
    const logs = await prisma.gdprLog.findMany({
      orderBy: { deletedAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ logs })

  } catch (error: any) {
    console.error('GDPR logs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
