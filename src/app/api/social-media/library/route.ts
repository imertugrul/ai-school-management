import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const search     = searchParams.get('search')
    const typeFilter = searchParams.get('type')

    const where: any = { authorId: user.id }
    if (typeFilter) where.type = typeFilter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }

    const items = await prisma.mediaLibraryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { name, url, type, size, tags } = await request.json()

    const item = await prisma.mediaLibraryItem.create({
      data: { authorId: user.id, name, url, type, size: size ?? 0, tags: tags ?? [] },
    })

    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
