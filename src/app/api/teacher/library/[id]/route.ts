import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.libraryQuestion.delete({ where: { id: params.id, teacherId: user.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const q = await prisma.libraryQuestion.update({
      where: { id: params.id, teacherId: user.id },
      data: body,
    })
    return NextResponse.json({ success: true, question: q })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
