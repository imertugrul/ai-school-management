import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const target = await prisma.user.findUnique({ where: { id: params.id } })
    if (!target || target.role !== 'SOCIAL_MEDIA_MANAGER') {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { department } = await request.json()

    const manager = await prisma.user.update({
      where: { id: params.id },
      data:  { department: department ?? null },
      select: { id: true, name: true, email: true, department: true, createdAt: true },
    })

    return NextResponse.json({ success: true, manager })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
