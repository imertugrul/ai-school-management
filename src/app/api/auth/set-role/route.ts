import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()

    if (!role || !['TEACHER', 'STUDENT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email: session.user.email! },
      data: { role }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Set role error:', error)
    return NextResponse.json({ error: 'Failed to set role' }, { status: 500 })
  }
}
