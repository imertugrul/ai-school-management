import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { status } = await request.json()
    if (!['ACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Update user status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

// Bulk update
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { ids, status } = await request.json()
    if (!Array.isArray(ids) || !['ACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { status },
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('Bulk update status error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
